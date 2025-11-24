from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import pandas as pd
import io

from .utils import (
    load_dataset,
    detect_areas_in_query,
    extract_years_from_query,
    filter_by_area,
    filter_last_n_years,
    calculate_growth,
    get_trend,
    build_chart_json,
    build_comparison_chart,
    generate_llm_summary,
)

@api_view(["POST"])
def chat_view(request):
    user_message = request.data.get("message", "")
    history_context = request.data.get("context", {})

    if not user_message:
        return Response({"error": "Please provide a message."}, status=400)

    df = load_dataset()
    if df is None:
        return Response({"error": "Dataset could not be loaded."}, status=500)

    # 1. Detect areas
    detected_areas = detect_areas_in_query(df, user_message)
    
    active_areas = []
    if detected_areas:
        active_areas = detected_areas
    elif history_context.get("areas"):
        active_areas = history_context.get("areas")
    
    if not active_areas:
        return Response({
            "summary": "I couldn't identify which locations you want to analyze. Try asking about specific places like 'Aundh', 'Wakad', or 'Ambegaon'.",
            "chart": None,
            "table": [],
            "growth": None,
            "context": {}
        })

    # 2. Detect Timeframe (N years)
    n_years = extract_years_from_query(user_message)

    # 3. Filter Data (Area + Time)
    df_area = filter_by_area(df, active_areas)
    if n_years:
        df_area = filter_last_n_years(df_area, n_years)

    # 4. Determine Intent & Metric
    msg_lower = user_message.lower()
    
    # Default metric mapping based on keywords
    if any(x in msg_lower for x in ["demand", "units sold", "sales volume", "sales"]):
        measure = "total sold - igr"
        measure_label = "Demand (Units Sold)"
    else:
        # Default to price ("price", "rate", "value" or fallback)
        measure = "flat - weighted average rate"
        measure_label = "Price (Weighted Avg)"

    # 5. Calculate Growth Metrics
    # We calculate growth for the *first* active area if multiple, 
    # or an aggregate if that makes sense. For simplicity, let's do it for the primary area 
    # or average of all if "all" is selected (though "growth" object implies singular context in UI usually).
    # Let's generate growth metrics specifically for the first area in the list for detailed display.
    
    growth_metrics = None
    if len(active_areas) == 1:
        # Growth for specific area
        growth_metrics = calculate_growth(df_area, measure)
    elif len(active_areas) > 1:
        # For multiple areas, we might not show the single "growth" card, 
        # or we could calculate it for the aggregate. 
        # Let's skip single-card growth for comparison to avoid confusion, 
        # or calculate for the *overall* dataset trend if "all" was asked.
        pass

    # 6. Chart Logic
    chart_keywords = [
        "chart", "graph", "plot", "trend", "compare", "difference", 
        "vs", "better", "analysis", "analyze", "best", "buy", "growth"
    ]
    should_show_chart = any(kw in msg_lower for kw in chart_keywords)
    
    if len(active_areas) > 1:
        should_show_chart = True

    chart_json = None
    if should_show_chart:
        if len(active_areas) > 1:
            chart_json = build_comparison_chart(df_area, active_areas, measure)
        else:
            trend_df = get_trend(df_area, measure)
            chart_json = build_chart_json(trend_df, data_col=measure, label=measure_label)

    # 7. Generate Summary (Passing growth data for context)
    summary = generate_llm_summary(
        active_areas, 
        df_area, 
        measure, 
        user_query=user_message, 
        growth_data=growth_metrics
    )

    # 8. Prepare Table Data
    # Smart columns based on metric
    table_cols = ["year", "final location"]
    if measure == "total sold - igr":
        table_cols.append("total sold - igr")
    else:
        table_cols.append("flat - weighted average rate")
        
    # If user wants comparison or general info, show both? 
    # Sticking to the requested measure for clarity + location/year.
    
    # Verify cols exist
    table_cols = [c for c in table_cols if c in df_area.columns]
    
    if not df_area.empty:
        # Sort by year desc, then location
        df_area_sorted = df_area.sort_values(by=["year", "final location"], ascending=[False, True])
        table_data = df_area_sorted[table_cols].to_dict(orient="records")
    else:
        table_data = []

    return Response({
        "summary": summary,
        "chart": chart_json,
        "table": table_data,
        "growth": growth_metrics, # New field
        "context": {"areas": active_areas}
    })


@api_view(["POST"])
def download_report(request):
    areas = request.data.get("areas", [])
    
    df = load_dataset()
    if df is None:
        return Response({"error": "Dataset not available"}, status=500)

    if areas:
        df_export = filter_by_area(df, areas)
    else:
        df_export = df

    if df_export.empty:
        return Response({"error": "No data found to export."}, status=404)

    buffer = io.StringIO()
    df_export.to_csv(buffer, index=False)
    buffer.seek(0)
    
    response = HttpResponse(buffer.getvalue(), content_type='text/csv')
    filename = f"Real_Estate_Report_{'_'.join(areas) if areas else 'Full'}.csv"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response