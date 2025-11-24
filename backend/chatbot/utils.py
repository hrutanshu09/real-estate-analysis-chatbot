import os
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
    areas = df["final location"].unique().tolist()
    msg = user_message.lower()
    found = [a for a in areas if a.lower() in msg]
    return found


def filter_by_area(df, areas):
    return df[df["final location"].isin(areas)].copy()


def get_trend(df, measure):
    grouped = df.groupby("year")[measure].mean().reset_index()
    return grouped


def build_chart_json(grouped_df, label):
    return {
        "labels": grouped_df["year"].tolist(),
        "datasets": [
            {
                "label": label,
                "data": grouped_df[label].tolist(),
            }
        ]
    }


def generate_llm_summary(area, df_area, measure):

    avg_price = round(df_area["flat - weighted average rate"].mean(), 2)
    avg_demand = round(df_area["total sold - igr"].mean(), 2)
    years = sorted(df_area["year"].unique().tolist())
    total_records = len(df_area)

    prompt = f"""
You are an expert real estate analyst.
Summarize the real estate performance of '{area}'.

Dataset:
- Years: {years}
- Total Records: {total_records}
- Avg Weighted Price: {avg_price}
- Avg Demand: {avg_demand}
- Trend Metric: {measure}

Write a short, clear summary in 4–6 lines.
"""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text if hasattr(response, "text") else str(response)

    except Exception as e:
        print("Gemini API error:", e)
        return f"Avg price {avg_price}, Avg demand {avg_demand}. Trend stable."


def build_comparison_chart(df, areas, measure):

    labels = sorted(df["year"].tolist())
    datasets = []

    for area in areas:
        df_area = df[df["final location"] == area]
        grouped = df_area.groupby("year")[measure].mean().reindex(labels, fill_value=0)
        datasets.append({
            "label": area,
            "data": grouped.tolist(),
        })

    return {"labels": labels, "datasets": datasets}
