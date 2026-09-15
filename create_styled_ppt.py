from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
import os

prs = Presentation()

# Slide 1: Title Slide (layout 6 - blank)
slide_layout_blank = prs.slide_layouts[6] 

def apply_dark_bg(slide):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = RGBColor(26, 26, 26)

def add_styled_title_slide(prs, title, subtitle, image_path):
    slide = prs.slides.add_slide(slide_layout_blank)
    apply_dark_bg(slide)
    
    # Add full-screen image if provided
    if image_path and os.path.exists(image_path):
        slide.shapes.add_picture(image_path, 0, 0, width=prs.slide_width)
        
    # Add title box with semi-transparent background (fallback to solid if not supported)
    left = Inches(0.5)
    top = Inches(2.5)
    width = Inches(9)
    height = Inches(2.5)
    
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    
    p = tf.add_paragraph()
    p.text = title
    p.font.bold = True
    p.font.size = Pt(44)
    p.font.color.rgb = RGBColor(255, 255, 255)
    
    p2 = tf.add_paragraph()
    p2.text = subtitle
    p2.font.size = Pt(24)
    p2.font.color.rgb = RGBColor(0, 200, 255) # Cyan

def add_styled_content_slide(prs, title, bullets, notes, image_path=None):
    slide = prs.slides.add_slide(slide_layout_blank)
    apply_dark_bg(slide)
    
    # If image provided, put it on the right side
    if image_path and os.path.exists(image_path):
        pic_left = prs.slide_width / 2
        pic_top = 0
        pic_width = prs.slide_width / 2
        slide.shapes.add_picture(image_path, pic_left, pic_top, width=pic_width)
        
        text_width = (prs.slide_width / 2) - Inches(1)
    else:
        text_width = prs.slide_width - Inches(2)
        
    # Add Title
    title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.5), text_width, Inches(2.0))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    p_title = tf_title.add_paragraph()
    p_title.text = title
    p_title.font.bold = True
    p_title.font.size = Pt(36)
    p_title.font.color.rgb = RGBColor(255, 255, 255)
    
    # Add Bullets
    body_box = slide.shapes.add_textbox(Inches(0.5), Inches(2.5), text_width, Inches(4.5))
    tf_body = body_box.text_frame
    tf_body.word_wrap = True
    for i, bullet in enumerate(bullets):
        if i == 0:
            p = tf_body.paragraphs[0]
        else:
            p = tf_body.add_paragraph()
        p.text = "• " + bullet
        p.font.size = Pt(24)
        p.font.color.rgb = RGBColor(200, 200, 200)
        p.space_after = Pt(14)
        
    # Add Notes
    if slide.has_notes_slide:
        notes_slide = slide.notes_slide
        text_frame = notes_slide.notes_text_frame
        text_frame.text = notes

# Paths to the generated images
img_server = r"C:\Users\vinay\.gemini\antigravity\brain\34513eab-cc0a-4151-b48e-bc880d80e387\server_room_bg_1786646294381.jpg"
img_ai = r"C:\Users\vinay\.gemini\antigravity\brain\34513eab-cc0a-4151-b48e-bc880d80e387\ai_network_bg_1786646317084.jpg"
img_dash = r"C:\Users\vinay\.gemini\antigravity\brain\34513eab-cc0a-4151-b48e-bc880d80e387\dashboard_bg_1786646616855.jpg"
img_future = r"C:\Users\vinay\.gemini\antigravity\brain\34513eab-cc0a-4151-b48e-bc880d80e387\future_tech_bg_1786647002680.jpg"

# Slide 1
add_styled_title_slide(prs, "AI-Based Intelligent Event Management System", "Revolutionizing Real-Time Operations", img_server)

# Slide 2
add_styled_content_slide(prs, "The Challenge: Volume & Velocity", ["Massive volume of digital events.", "High velocity is too much for manual monitoring.", "Goal: Ensure maximum uptime."], "Every device, application, and user generates events. The sheer volume and velocity of these digital events are too massive for manual monitoring. Our goal is to ensure maximum uptime.", img_server)

# Slide 3
add_styled_content_slide(prs, "The Existing System & Limitations", ["Reactive approach", "Alert Fatigue", "High MTTR (Mean Time to Resolution)"], "The current system is broken. It relies on manual thresholds. Operators suffer from 'alert fatigue'—thousands of false alarms. This leads to slow response times (MTTR) because data is siloed.")

# Slide 4
add_styled_content_slide(prs, "The Proposed System: AI-Based IEM", ["Proactive & Predictive", "Automated Resolution", "Shift from fixing to predicting"], "The proposed solution is an AI-Based Intelligent Event Management System. It uses AIOps to ingest, analyze, and act instantly. We are shifting from fixing things after they break, to predicting them before they fail.", img_ai)

# Slide 5
add_styled_content_slide(prs, "Managing Real-Time Events", ["1. Ingestion (Millions/sec)", "2. Noise Reduction (Filter)", "3. Correlation (Identify Root Cause)"], "The core of this system is real-time processing. First, it ingests millions of events instantly without lag. Second, it deduplicates and filters the noise. Third, it groups related events to find the single root cause in milliseconds.", img_dash)

# Slide 6
add_styled_content_slide(prs, "AI & Emerging Technologies", ["Machine Learning (Anomaly Detection)", "NLP (Log Parsing)", "Predictive Analytics (Forecasting)"], "How do we do this? With AI. Machine Learning learns what 'normal' looks like. Natural Language Processing reads server logs like a human would. Predictive analytics forecasts outages before users even notice.", img_ai)

# Slide 7
add_styled_content_slide(prs, "Tech Stack & Architecture", ["Ingestion: Kafka", "Processing: Apache Spark + AI", "Storage: Elasticsearch"], "Architecturally, we use Apache Kafka to stream the real-time data. Apache Spark and our AI models process it instantly. Finally, Elasticsearch stores the data for visualization in dashboards like Grafana. (Visual note: Add boxes and arrows here).", img_dash)

# Slide 8
add_styled_content_slide(prs, "Benefits & Future Scope", ["Now: 90% Noise Reduction", "Future: GenAI Chatbots", "Future: Self-Healing Infrastructure"], "The immediate benefit is a 90% reduction in alert noise and maximum uptime. Looking forward, we will integrate Generative AI so operators can 'chat' with the system to ask what broke, eventually moving toward a completely self-healing infrastructure.", img_future)

# Slide 9
add_styled_content_slide(prs, "Conclusion & Q&A", ["Real-time agility meets AI automation", "Questions?"], "To conclude, real-time agility combined with AI automation is the future of event management. Thank you. I’d love to answer any questions.", img_future)

prs.save('AI_Event_Management_Presentation_Styled.pptx')
print('PPTX generated successfully as AI_Event_Management_Presentation_Styled.pptx')
