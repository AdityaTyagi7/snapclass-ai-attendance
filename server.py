import os
import io
import json
from typing import List, Optional
from datetime import datetime

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import existing backend functions
from src.database.db import (
    check_teacher_exists,
    create_teacher,
    teacher_login,
    get_all_students,
    create_student,
    create_subject,
    get_teacher_subjects,
    enroll_student_to_subject,
    unenroll_student_to_subject,
    get_student_subjects,
    get_student_attendance,
    create_attendance,
    get_attendance_for_teacher,
)
from src.database.config import supabase
from src.pipelines.face_pipeline import (
    predict_attendance,
    get_face_embeddings,
    train_classifier,
)
from src.pipelines.voice_pipeline import (
    get_voice_embedding,
    process_bulk_audio,
)

app = FastAPI(title="SnapClass API", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class TeacherLoginRequest(BaseModel):
    username: str
    password: str

class TeacherRegisterRequest(BaseModel):
    username: str
    name: str
    password: str
    confirm_password: str

class CreateSubjectRequest(BaseModel):
    subject_code: str
    name: str
    section: str
    teacher_id: int

class EnrollSubjectRequest(BaseModel):
    student_id: int
    subject_code: str

class UnenrollSubjectRequest(BaseModel):
    student_id: int
    subject_id: int

class LogEntry(BaseModel):
    student_id: int
    subject_id: int
    timestamp: str
    is_present: bool

class AttendanceConfirmRequest(BaseModel):
    logs: List[LogEntry]


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "SnapClass API Backend is running"}


# --- TEACHER AUTH ENDPOINTS ---

@app.post("/api/auth/teacher/login")
def teacher_login_endpoint(req: TeacherLoginRequest):
    teacher = teacher_login(req.username, req.password)
    if not teacher:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {
        "success": True,
        "teacher": {
            "teacher_id": teacher["teacher_id"],
            "name": teacher["name"],
            "username": teacher["username"],
        },
    }

@app.post("/api/auth/teacher/register")
def teacher_register_endpoint(req: TeacherRegisterRequest):
    if not req.username or not req.name or not req.password:
        raise HTTPException(status_code=400, detail="All fields are required")
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if check_teacher_exists(req.username):
        raise HTTPException(status_code=400, detail="Username is already taken")
    
    try:
        created = create_teacher(req.username, req.password, req.name)
        return {"success": True, "message": "Successfully created account. Please login."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- TEACHER SUBJECTS & RECORDS ---

@app.get("/api/teacher/subjects")
def get_teacher_subjects_endpoint(teacher_id: int):
    subjects = get_teacher_subjects(teacher_id)
    return {"subjects": subjects}

@app.post("/api/teacher/subjects")
def create_subject_endpoint(req: CreateSubjectRequest):
    if not req.subject_code or not req.name:
        raise HTTPException(status_code=400, detail="Subject code and name are required")
    
    # Check if subject code exists
    existing = supabase.table("subjects").select("*").eq("subject_code", req.subject_code).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Subject code already exists")
    
    try:
        created = create_subject(req.subject_code, req.name, req.section, req.teacher_id)
        return {"success": True, "subject": created[0] if created else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teacher/attendance-records")
def get_teacher_attendance_records(teacher_id: int):
    records = get_attendance_for_teacher(teacher_id)
    return {"records": records}


# --- STUDENT AUTH & REGISTRATION ---

@app.post("/api/auth/student/scan-face")
async def scan_face_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        img_np = np.array(img)
        detected, all_ids, num_faces = predict_attendance(img_np)
        
        matched_student = None
        if num_faces == 1 and detected:
            student_id = list(detected.keys())[0]
            all_students = get_all_students()
            matched_student = next((s for s in all_students if s["student_id"] == student_id), None)
            
        return {
            "num_faces": num_faces,
            "detected_ids": list(detected.keys()),
            "matched_student": matched_student,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process face image: {str(e)}")

@app.post("/api/auth/student/register")
async def register_student_endpoint(
    name: str = Form(...),
    face_image: UploadFile = File(...),
    voice_audio: Optional[UploadFile] = File(None),
):
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    
    try:
        image_bytes = await face_image.read()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(img)
        
        encodings = get_face_embeddings(img_np)
        if not encodings:
            raise HTTPException(status_code=400, detail="Could not detect face features in the provided image")
        
        face_emb = encodings[0].tolist()
        voice_emb = None
        
        if voice_audio:
            audio_bytes = await voice_audio.read()
            if audio_bytes and len(audio_bytes) > 0:
                voice_emb = get_voice_embedding(audio_bytes)
                if voice_emb is None:
                    print(f"[WARN] Voice embedding extraction returned None for student {name}")
                
        response_data = create_student(name, face_embedding=face_emb, voice_embedding=voice_emb)
        if response_data:
            train_classifier()
            return {"success": True, "student": response_data[0]}
        else:
            raise HTTPException(status_code=500, detail="Failed to insert student profile into database")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- STUDENT SUBJECTS & ENROLLMENT ---

@app.get("/api/student/dashboard-data")
def get_student_dashboard_data(student_id: int):
    subjects = get_student_subjects(student_id)
    logs = get_student_attendance(student_id)
    
    # Check student voice profile status
    student_res = supabase.table("students").select("student_id, name, voice_embedding").eq("student_id", student_id).execute()
    has_voice = False
    if student_res.data:
        has_voice = bool(student_res.data[0].get("voice_embedding"))
        
    # Calculate stats
    stats_map = {}
    for log in logs:
        sid = log["subject_id"]
        if sid not in stats_map:
            stats_map[sid] = {"total": 0, "attended": 0}
        stats_map[sid]["total"] += 1
        if log.get("is_present"):
            stats_map[sid]["attended"] += 1
            
    return {"subjects": subjects, "logs": logs, "stats_map": stats_map, "has_voice": has_voice}

@app.post("/api/student/update-voice")
async def update_student_voice_endpoint(
    student_id: int = Form(...),
    voice_audio: UploadFile = File(...),
):
    audio_bytes = await voice_audio.read()
    if not audio_bytes or len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Audio file is empty")
    
    voice_emb = get_voice_embedding(audio_bytes)
    if not voice_emb:
        raise HTTPException(status_code=400, detail="Could not extract voice features. Please record 2-3 seconds of clear speech and try again.")
    
    res = supabase.table("students").update({"voice_embedding": voice_emb}).eq("student_id", student_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Student not found")
        
    return {"success": True, "message": "Voice biometric profile registered successfully!", "student": res.data[0]}

@app.post("/api/student/enroll")
def enroll_student_endpoint(req: EnrollSubjectRequest):
    if not req.subject_code:
        raise HTTPException(status_code=400, detail="Subject code is required")
    
    res = supabase.table("subjects").select("subject_id, name, subject_code").eq("subject_code", req.subject_code).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Subject code not found")
    
    subject = res.data[0]
    check = supabase.table("subject_students").select("*").eq("subject_id", subject["subject_id"]).eq("student_id", req.student_id).execute()
    if check.data:
        raise HTTPException(status_code=400, detail="You are already enrolled in this course")
    
    enroll_student_to_subject(req.student_id, subject["subject_id"])
    return {"success": True, "message": f"Successfully enrolled in {subject['name']}"}

@app.post("/api/student/unenroll")
def unenroll_student_endpoint(req: UnenrollSubjectRequest):
    unenroll_student_to_subject(req.student_id, req.subject_id)
    return {"success": True, "message": "Unenrolled successfully"}


# --- ATTENDANCE AI PROCESSING ENDPOINTS ---

@app.post("/api/attendance/face-scan")
async def process_face_attendance_endpoint(
    subject_id: int = Form(...),
    photos: List[UploadFile] = File(...),
):
    if not photos:
        raise HTTPException(status_code=400, detail="At least one photo is required")
    
    all_detected_ids = {}
    
    for idx, photo in enumerate(photos):
        content = await photo.read()
        img = Image.open(io.BytesIO(content)).convert("RGB")
        img_np = np.array(img)
        detected, _, _ = predict_attendance(img_np)
        
        if detected:
            for sid in detected.keys():
                student_id_int = int(sid)
                all_detected_ids.setdefault(student_id_int, []).append(f"Photo {idx+1}")
                
    enrolled_res = supabase.table("subject_students").select("*, students(*)").eq("subject_id", subject_id).execute()
    enrolled_students = enrolled_res.data
    
    if not enrolled_students:
        return {"results": [], "logs": [], "message": "No students enrolled in this course"}
    
    results = []
    attendance_to_log = []
    current_timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    
    for node in enrolled_students:
        student = node["students"]
        sources = all_detected_ids.get(int(student["student_id"]), [])
        is_present = len(sources) > 0
        
        results.append({
            "student_id": student["student_id"],
            "name": student["name"],
            "source": ", ".join(sources) if is_present else "-",
            "is_present": is_present,
            "status": "Present" if is_present else "Absent",
        })
        
        attendance_to_log.append({
            "student_id": student["student_id"],
            "subject_id": subject_id,
            "timestamp": current_timestamp,
            "is_present": bool(is_present),
        })
        
    return {"results": results, "logs": attendance_to_log}

@app.post("/api/attendance/voice-scan")
async def process_voice_attendance_endpoint(
    subject_id: int = Form(...),
    audio: UploadFile = File(...),
):
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty")
    
    enrolled_res = supabase.table("subject_students").select("*, students(*)").eq("subject_id", subject_id).execute()
    enrolled_students = enrolled_res.data
    
    if not enrolled_students:
        raise HTTPException(status_code=400, detail="No students enrolled in this course")
    
    candidates_dict = {
        s["students"]["student_id"]: s["students"]["voice_embedding"]
        for s in enrolled_students if s["students"].get("voice_embedding")
    }
    
    if not candidates_dict:
        raise HTTPException(status_code=400, detail="No enrolled students have voice profiles registered")
    
    detected_scores = process_bulk_audio(audio_bytes, candidates_dict)
    results = []
    attendance_to_log = []
    current_timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    
    for node in enrolled_students:
        student = node["students"]
        score = detected_scores.get(student["student_id"], 0.0)
        is_present = bool(score > 0)
        
        results.append({
            "student_id": student["student_id"],
            "name": student["name"],
            "score": round(score, 3) if is_present else 0.0,
            "source": f"Match Score: {round(score, 2)}" if is_present else "-",
            "is_present": is_present,
            "status": "Present" if is_present else "Absent",
        })
        
        attendance_to_log.append({
            "student_id": student["student_id"],
            "subject_id": subject_id,
            "timestamp": current_timestamp,
            "is_present": bool(is_present),
        })
        
    return {"results": results, "logs": attendance_to_log}

@app.post("/api/attendance/confirm")
def confirm_attendance_endpoint(req: AttendanceConfirmRequest):
    if not req.logs:
        raise HTTPException(status_code=400, detail="Logs array cannot be empty")
    
    try:
        logs_dict = [log.dict() for log in req.logs]
        created = create_attendance(logs_dict)
        return {"success": True, "count": len(logs_dict), "created": created}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
