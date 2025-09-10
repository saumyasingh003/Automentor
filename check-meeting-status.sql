-- Debug queries for meeting status and Ask AI functionality

-- Check meeting statuses
SELECT 
    id,
    name,
    status,
    started_at,
    ended_at,
    transcript_url IS NOT NULL as has_transcript,
    summary IS NOT NULL as has_summary,
    LENGTH(summary) as summary_length,
    created_at
FROM meetings 
ORDER BY created_at DESC 
LIMIT 10;

-- Check specific meeting by ID (replace 'your-meeting-id' with actual ID)
-- SELECT * FROM meetings WHERE id = 'your-meeting-id';

-- Check agents
SELECT id, name, user_id FROM agents ORDER BY created_at DESC LIMIT 5;

-- Find meetings that should have Ask AI available (completed with summary)
SELECT 
    m.id,
    m.name,
    m.status,
    a.name as agent_name,
    LENGTH(m.summary) as summary_length
FROM meetings m
JOIN agents a ON m.agent_id = a.id
WHERE m.status = 'completed' 
AND m.summary IS NOT NULL
ORDER BY m.created_at DESC;