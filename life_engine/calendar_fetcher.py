import os
from datetime import datetime,timedelta

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES=['https://www.googleapis.com/auth/calendar.readonly']

def get_upcoming_events(credentials_dict=None,max_results=10):
    creds=None
    if credentials_dict:
        creds=Credentials.from_authorized_user_info(credentials_dict,SCOPES)
    elif os.path.exists('token.json'):
        creds=Credentials.from_authorized_user_file('token.json',SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow=InstalledAppFlow.from_client_secrets_file('credentials.json',SCOPES)
            creds=flow.run_local_server(port=0)
        with open('token.json','w') as token:
            token.write(creds.to_json())

    try:
        service=build('calendar','v3',credentials=creds)
        now=datetime.utcnow().isoformat()+'Z'
        end_of_week=(datetime.utcnow()+timedelta(days=7)).isoformat()+'Z' 
        events_result=service.events().list(
            calendarId='primary',
            timeMin=now,
            timeMax=end_of_week,
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events=events_result.get('items',[])

        formatted_events=[]
        for event in events:
            start=event['start'].get('dateTime',event['start'].get('date'))
            formatted_events.append({
                'title':event.get('summary','No title'),
                'location':event.get('location',''),
                'start_time':start,
                'attendees':len(event.get('attendees',[])) if event.get('attendees') else 0
            })
        
        return formatted_events
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return []

if __name__=='__main__':
    events=get_upcoming_events()
    for event in events:
        print(f"{event['title']} at {event['start_time']}")
