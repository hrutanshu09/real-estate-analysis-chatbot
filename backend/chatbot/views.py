from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .utils import (
    load_dataset,
    detect_areas_in_query,
    filter_by_area,
    get_trend,
    build_chart_json,
    generate_llm_summary,
)


@api_view(["POST"])
def chat_view(request):
    user_message = request.data.get("message", "")

    if not user_message:
        return Response({"error": "Please provide a message."}, status=400)

    df = load_dataset()
    if df is None:
        return Response({"error": "Dataset could not be loaded."}, status=500)

    # Detect locations mentioned in the message
    areas = detect_areas_in_query(df, user_message)

    if not areas:
        return Response({
            "summary": "No known area found. Try: Akurdi, Aundh, Hadapsar, etc.",
            "chart": None,
            "table": [],
        })

    selected_area = areas[0]  # For step 1, only handle single area

    df_area = filter_by_area(df, [selected_area])

    # Determine whether user wants demand or price trend
    msg = user_message.lower()
    if "demand" in msg:
        measure = "total sold - igr"
    else:
        measure = "flat - weighted average rate"

    # Build trend
    trend_df = get_trend(df_area, measure)
    chart_json = build_chart_json(trend_df, label=measure)

    # Generate Gemini summary
    summary = generate_llm_summary(selected_area, df_area, measure)

    # Prepare table (only essential columns)
    table_cols = [
        "year",
        "final location",
        " flat - weighted average rate ",
        "total sold - igr",
        "flat total"
    ]

    table_cols = [c for c in table_cols if c in df_area.columns]
    table_data = df_area[table_cols].to_dict(orient="records")

    return Response({
        "summary": summary,
        "chart": chart_json,
        "table": table_data,
    })
