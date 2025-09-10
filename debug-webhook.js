// Debug script to test webhook events
// Run this to see what events your webhook is receiving

const events = [
  'call.session_started',
  'call.session.participant_left', 
  'call.ended',
  'call.session_ended',
  'call.transcription_ready',
  'call.recording_ready',
  'message_new'
];

console.log('Expected webhook events:');
events.forEach(event => {
  console.log(`- ${event}`);
});

console.log('\nIf your meetings are not ending properly, check:');
console.log('1. Are you receiving "call.ended" events?');
console.log('2. Are transcription_ready events being triggered?');
console.log('3. Check your server logs for the console.log messages added');
console.log('4. Verify the meetingId is being extracted correctly from events');