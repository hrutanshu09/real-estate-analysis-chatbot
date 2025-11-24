from django.urls import path
from .views import chat_view, download_report  # <--- Make sure download_report is added here

urlpatterns = [
    path("chat/", chat_view, name="chat"),
    path("download/", download_report, name="download_report"),
]