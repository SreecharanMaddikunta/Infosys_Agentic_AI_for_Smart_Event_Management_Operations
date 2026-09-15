from app.services.intelligence_engine import generate_insights, EventData

def process_event(event_id: int, context_type: str, data: dict):
    """
    The orchestrator receives a raw event, determines which agent should process it,
    and calls the intelligence engine.
    """
    event_data = EventData(
        event_id=event_id,
        context_type=context_type,
        data=data
    )
    
    # In a full multi-agent LLM setup, this router would dynamically pick the agent.
    # We simulate this orchestration logic based on the context type.
    selected_agent = "GeneralAgent"
    if context_type == "CAPACITY":
        selected_agent = "VenueAgent"
    elif context_type == "SCHEDULE":
        selected_agent = "SchedulingAgent"
    elif context_type == "INCIDENT":
        selected_agent = "IncidentAgent"
        
    print(f"[Orchestrator] Routed event {context_type} for event {event_id} to {selected_agent}")
    
    # Get insights from the engine based on the routed context
    analysis_result = generate_insights(event_data)
    
    # Inject the chosen agent into the result if a recommendation was made
    if analysis_result.get("recommendation"):
        analysis_result["recommendation"]["sourceAgent"] = selected_agent
        
    return analysis_result
