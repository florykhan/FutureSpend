from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
app=FastAPI()

class CalendarEvent(BaseModel):
    title:str
    location: Optional[str]=None
    start_time:str
    attendees: Optional[int]=None

class PredictRequest(BaseModel):
    events: List[CalendarEvent]

class PredictResponse(BaseModel):
    predicted_total:float
    confidence:float
    breakdown:dict

@app.get("/")
def read_root():
    return {"message": "working"}

@app.post("/predict", response_model=PredictResponse)
def predict_spending(request:PredictRequest):
    total=0
    for event in request.events:
        if "dinner" in event.title.lower():
            total+=60
        elif "concert" in event.title.lower():
            total+=120
        elif "coffee" in event.title.lower():
            total+=15
        else:
            total+=20
    
    return {
        "predicted_total":total,
        "confidence":0.85,
        "breakdown":{
            "food":total*0.5,
            "entertainment":total*0.3,
            "transport":total*0.2
        }
    }