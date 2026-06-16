import re
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8743/index.html"
SHOTS = "C:/Users/darwi/Desktop/AlgebraHub/_shots"
import os
os.makedirs(SHOTS, exist_ok=True)

console_errors = []
results = []

def log_console(msg):
    if msg.type == "error":
        console_errors.append(msg.text)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.on("console", log_console)
    page.on("pageerror", lambda exc: console_errors.append(f"pageerror: {exc}"))

    page.goto(BASE)
    page.wait_for_selector("#navbar button")
    page.screenshot(path=f"{SHOTS}/01_home.png", full_page=True)
    results.append(("home", page.title()))

    # --- Lesson -> a lesson topic -> back ---
    page.click("text=Lesson")
    page.wait_for_selector("text=Lessons")
    page.screenshot(path=f"{SHOTS}/02_learning_landing.png", full_page=True)

    page.click("text=Linear Equations")
    page.wait_for_selector("text=Key concepts")
    page.screenshot(path=f"{SHOTS}/03_lesson_linear.png", full_page=True)

    page.click("text=Back to topics")
    page.wait_for_selector("text=Lessons")

    # --- Practice -> a quiz topic -> back ---
    page.click(".nav-btn:has-text('Practice')")
    page.wait_for_selector("text=Practice Quizzes")
    page.screenshot(path=f"{SHOTS}/04_practice_landing.png", full_page=True)

    page.click(".quiz-topic-card:has-text('Quadratic Functions')")
    page.wait_for_selector("text=Quiz")
    page.screenshot(path=f"{SHOTS}/05_quiz_quadratic.png", full_page=True)

    page.click("text=Exit quiz")
    page.wait_for_selector("text=Practice Quizzes")

    # --- Game -> Drag & Drop -> back ---
    page.click(".nav-btn:has-text('Game')")
    page.wait_for_selector("text=Algebra Games")
    page.screenshot(path=f"{SHOTS}/06_game_landing.png", full_page=True)

    page.click("text=Drag & Drop")
    page.wait_for_selector("text=drop here")
    page.screenshot(path=f"{SHOTS}/07_dragdrop.png", full_page=True)

    page.click("text=Back to games")
    page.wait_for_selector("text=Algebra Games")

    # --- Game -> Word Match -> back ---
    page.click("text=Word Match")
    page.wait_for_selector("text=Matched 2 / 4")
    page.screenshot(path=f"{SHOTS}/08_wordmatch.png", full_page=True)

    page.click("text=Back to games")
    page.wait_for_selector("text=Algebra Games")

    # back home via brand logo
    page.click(".nav-brand")
    page.wait_for_selector("text=Welcome to")
    page.screenshot(path=f"{SHOTS}/09_back_home.png", full_page=True)

    browser.close()

print("PAGE_TITLE:", results[0][1])
print("CONSOLE_ERRORS:", console_errors if console_errors else "NONE")
print("DONE")
