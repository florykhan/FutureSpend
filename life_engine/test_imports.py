
print("Testing imports...")

try:
    import parser
    print("✅ parser module imported successfully")
except ImportError as e:
    print("❌ parser import failed:", e)

try:
    import prediction
    print("✅ predictor module imported successfully")
except ImportError as e:
    print("❌ predictor import failed:", e)

try:
    import element_of_game as challenge
    print("✅ challenge module imported successfully")
except ImportError as e:
    print("❌ challenge import failed:", e)

try:
    import leaderboard
    print("✅ leaderboard module imported successfully")
except ImportError as e:
    print("❌ leaderboard import failed:", e)

try:
    import calendar_fetcher
    print("✅ calendar_fetcher module imported successfully")
except ImportError as e:
    print("❌ calendar_fetcher import failed:", e)

try:
    import mock_bank
    print("✅ mock_bank module imported successfully")
except ImportError as e:
    print("❌ mock_bank import failed:", e)

print("\nIf all passed, the modules are correctly placed and importable.")