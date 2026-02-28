API Documentation
Base URL: http://localhost:8000
All endpoints expect Content-Type: application/json.





1. Predict Spending
Endpoint: POST /predict

Description:
Accepts a list of calendar events and returns predicted total spending, confidence score, and a breakdown by category.

===
Request Body:

json
{
  "events":[
    {
      "title":"string",           // required
      "location":"string",        // optional
      "start_time":"string",      // required, ISO format (e.g. "2024-03-15T19:00:00")
      "attendees":"integer"       // optional
    }
  ]
}
===
Example Request:

json
{
  "events":[
    {
      "title":"Dinner with friends",
      "location":"Earls",
      "start_time":"2024-03-15T19:00:00",
      "attendees":4
    },
    {
      "title":"Coffee meeting",
      "location":"Starbucks",
      "start_time":"2024-03-16T10:00:00",
      "attendees":2
    }
  ]
}
===
Response:

json
{
  "total_predicted":85.0,
  "confidence":0.9,
  "breakdown":{
    "food":70.0,
    "entertainment":0,
    "transport":0,
    "other":15.0
  }
}

total_predicted:float – estimated total spend

confidence:float (0–1) – confidence in the prediction

breakdown:object – spending by category (food, entertainment, transport, other)





2. Generate Challenge
Endpoint: POST /challenge

Description:
Creates a personalized savings challenge based on predicted total and (optionally) user history.

===
Request Body:

json
{
  "predicted_total":"float",       // required
  "user_id":"string"               // optional, for future personalization
}
===
Example Request:

json
{
  "predicted_total":185.0,
  "user_id":"user123"
}
===
Response:

json
{
  "challenge_id":"challenge_a1b2c3d4",
  "target_spending":157.25,
  "points":650,
  "suggested_friends":["Emma", "Olivia", "Noah"],
  "message":"Keep your spending under $157.25 this weekend and earn 650 points!"
}

challenge_id:unique identifier for the challenge

target_spending:float – spending goal (stay under this amount)

points:int – reward points for completing

suggested_friends:list of strings – friends to invite

message:string – friendly description






3. Get Leaderboard
Endpoint: POST /leaderboard

Description:
Ranks participants by spending (lowest first) and optionally marks who is under or over a challenge target.

===
Request Body:

json
{
  "participants":[
    {
      "name":"string",
      "spent":"float"
    }
  ],
  "challenge_target":"float"      // optional
}
===
Example Request:

json
{
  "participants":[
    {"name":"Alice","spent":120.5},
    {"name":"Bob","spent":95.0},
    {"name":"Charlie","spent":150.75},
    {"name":"Diana","spent":95.0}
  ],
  "challenge_target": 130.0
}
===
Response:

json
{
  "leaderboard":[
    {"name":"Bob", "spent": 95.0, "rank": 1, "status": "under"},
    {"name":"Diana", "spent": 95.0, "rank": 1, "status": "under"},
    {"name":"Alice", "spent": 120.5, "rank": 3, "status": "under"},
    {"name":"Charlie", "spent": 150.75, "rank": 4, "status": "over"}
  ]
}

rank:integer – 1-based ranking (ties share same rank)

status: 
        string or null – "under" 
        if spent ≤ target, 
        
        "over" if spent > target, 
        
        null if no target provided
