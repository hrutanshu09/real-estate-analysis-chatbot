import os
import re
import pandas as pd
from django.conf import settings
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

DATA_PATH = os.path.join(settings.DATA_DIR, "Sample_data.xlsx")


def load_dataset():
    try:
        df = pd.read_excel(DATA_PATH, engine="openpyxl")
        return df
    except Exception as e:
        print("Dataset load error:", e)
        return None


def detect_areas_in_query(df, user_message):
    """
    Scans the user message for known locations.
    Also handles 'all' or 'best' intents to select ALL locations.
    """
    unique_areas = df["final location"].unique().tolist()
    msg = user_message.lower()
    
    global_keywords = [
        "all locations", "all areas", "compare all", 
        "best buy", "best location", "top location",
        "best performing", "analyze all", "entire city", "best option"
    ]
    
    if any(phrase in msg for phrase in global_keywords):
        return unique_areas
    
    found = []
    for area in unique_areas:
        if area.lower() in msg:
            found.append(area)
            
    return list(set(found))


def extract_years_from_query(user_message):
    """
    Extracts 'last N years' from the query.
    Defaults to 3 if 'last'/'past' is present without a number.
    Returns None if no time filter is found.
    """
    msg = user_message.lower()
    
    # Regex for "last/past N years"
    match = re.search(r'(?:last|past)\s+(\d+)\s+years?', msg)
    if match:
        return int(match.group(1))
    
    # specific phrases or general keywords
    if "last few years" in msg or "past few years" in msg:
        return 3
    
    # Fallback: if user mentions "last year" or "past year" implies 1? 
    # Or "last years" implies recent trend? 
    # Prompt requirement: "if 'last' or 'past' appears -> activate time-filter" (default 3 if unspecified)
    if "last" in msg and "year" in msg:
        return 3
    if "past" in msg and "year" in msg:
        return 3
        
    return None


def filter_by_area(df, areas):
    if not areas:
        return pd.DataFrame()
    return df[df["final location"].isin(areas)].copy()


def filter_last_n_years(df, n):
    """
    Filters the dataframe to keep only the last N years based on the max year in data.
    """
    if df.empty or n is None:
        return df
        
    max_year = df["year"].max()
    min_year = max_year - (n - 1)
    
    filtered = df[df["year"] >= min_year].copy()
    return filtered.sort_values("year")


def calculate_growth(df, measure):
    """
    Calculates absolute & percentage growth and classifies trend.
    df must be filtered for a specific area and sorted by year.
    """
    if df.empty:
        return None
        
    # Ensure sorted by year
    df = df.sort_values("year")
    
    initial_val = df.iloc[0][measure]
    final_val = df.iloc[-1][measure]
    
    absolute_change = final_val - initial_val
    
    if initial_val != 0:
        percent_change = (absolute_change / initial_val) * 100
    else:
        percent_change = 0.0
        
    # Trend Classification
    if percent_change > 2:
        trend = "increasing"
    elif percent_change < -2:
        trend = "decreasing"
    else:
        trend = "stable"
        
    return {
        "initial": round(initial_val, 2),
        "final": round(final_val, 2),
        "absolute_change": round(absolute_change, 2),
        "percent_change": round(percent_change, 2),
        "trend": trend
    }


def get_trend(df, measure):
    grouped = df.groupby("year")[measure].mean().reset_index()
    return grouped


def build_chart_json(grouped_df, data_col, label):
    return {
        "labels": grouped_df["year"].tolist(),
        "datasets": [
            {
                "label": label,
                "data": grouped_df[data_col].tolist(),
            }
        ]
    }


def build_comparison_chart(df, areas, measure):
    labels = sorted(df["year"].unique().tolist())
    datasets = []

    for area in areas:
        area_df = df[df["final location"] == area]
        if area_df.empty:
            continue
            
        grouped = area_df.groupby("year")[measure].mean()
        grouped = grouped.reindex(labels, fill_value=None)
        
        datasets.append({
            "label": area,
            "data": grouped.tolist(),
        })

    return {"labels": labels, "datasets": datasets}


def generate_llm_summary(areas, df_area, measure, user_query="", growth_data=None):
    """
    Generates an AI summary including growth metrics if available.
    """
    data_summary_text = ""
    
    if isinstance(areas, str):
        areas = [areas]

    # Limit processed areas for context window safety
    processed_areas = areas[:10]
    
    for area in processed_areas:
        area_df = df_area[df_area["final location"] == area]
        if area_df.empty:
            continue

        avg_val = round(area_df[measure].mean(), 2)
        years = sorted(area_df["year"].unique().tolist())
        
        data_summary_text += f"""
Location: {area}
- Years: {years}
- Avg {measure}: {avg_val}
"""

    # Inject growth data into prompt if available (usually for single area analysis)
    growth_info = ""
    if growth_data:
        growth_info = f"""
Growth Analysis ({measure}):
- Initial Value: {growth_data['initial']}
- Final Value: {growth_data['final']}
- Absolute Change: {growth_data['absolute_change']}
- Percentage Change: {growth_data['percent_change']}%
- Trend: {growth_data['trend']}
"""

    prompt = f"""
You are an expert real estate analyst. 
User Question: "{user_query}"

Data Context:
Metric: {measure}
{data_summary_text}

{growth_info}

Instructions:
1. Answer the question directly using the data.
2. If growth data is provided, explicitly mention the {growth_data['trend'] if growth_data else 'trend'} trend over the selected years.
3. Use the percentage change to emphasize the magnitude of the shift.
4. Keep it concise (max 6 lines).
"""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text if hasattr(response, "text") else str(response)

    except Exception as e:
        print("Gemini API error:", e)
        return "I encountered an error analyzing the data, but you can view the charts below."