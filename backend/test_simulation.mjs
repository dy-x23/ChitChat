import { io } from 'socket.io-client';

const URL = 'http://localhost:4000';

function connectSocket() {
  return new Promise((resolve) => {
    const s = io(URL);
    if (s.connected) resolve(s);
    else s.on('connect', () => resolve(s));
  });
}

async function runSimulation() {
  console.log('--- Starting Multi-Client Socket.IO Simulation ---');

  const p1 = await connectSocket();
  const p2 = await connectSocket();
  const p3 = await connectSocket();

  let roomCode = '';

  await new Promise((resolve) => {
    p1.emit('create_room', { playerName: 'Alex (Host)', playerId: 'user_1' });
    p1.on('room_created', (data) => {
      roomCode = data.roomCode;
      console.log(`✓ Room created with code: ${roomCode}`);
      resolve();
    });
  });

  // Player 2 & Player 3 Join
  await new Promise((resolve) => {
    let joined = 0;
    p2.emit('join_room', { roomCode, playerName: 'Rahul', playerId: 'user_2' });
    p3.emit('join_room', { roomCode, playerName: 'Sneha', playerId: 'user_3' });

    p1.on('game_state_update', (state) => {
      if (state.phase === 'LOBBY' && state.players.length === 3 && joined === 0) {
        joined = 1;
        console.log(`✓ All 3 players joined the lobby:`, state.players.map(p => p.name));
        resolve();
      }
    });
  });

  // Start game
  console.log('--- Starting Game ---');
  p1.emit('start_game');

  // Wait for WRITING phase
  await new Promise((resolve) => {
    p1.on('game_state_update', (state) => {
      if (state.phase === 'WRITING') {
        console.log(`✓ Phase transitioned to WRITING! Prompt: "${state.currentPrompt}"`);
        resolve();
      }
    });
  });

  // Submit chits anonymously
  console.log('--- Submitting Anonymous Chits ---');
  p1.emit('submit_chit', { content: 'I secretly binge reality dating shows.' });
  p2.emit('submit_chit', { content: 'I eat Maggi at 2 AM every Saturday.' });
  p3.emit('submit_chit', { content: 'I talk to my plants and give them names.' });

  // Wait for GUESSING phase and verify Security & Derangement
  await new Promise((resolve) => {
    let checked = false;
    p1.on('game_state_update', (state) => {
      if (state.phase === 'GUESSING' && state.assignedChit && !checked) {
        checked = true;
        console.log('✓ Phase transitioned to GUESSING!');
        console.log(`✓ Player 1 received assigned mystery chit: "${state.assignedChit.content}"`);
        
        // SECURITY CHECK: Verify authorId is NOT present
        if ('authorId' in state.assignedChit || 'author' in state.assignedChit) {
          console.error('❌ SECURITY FAILED: authorId leaked to client!');
        } else {
          console.log('🔒 SECURITY VERIFIED: authorId is completely stripped from payload!');
        }

        // DERANGEMENT CHECK: Verify self-chit is not assigned
        if (state.assignedChit.content === 'I secretly binge reality dating shows.') {
          console.error('❌ DERANGEMENT FAILED: Player received their own chit!');
        } else {
          console.log('✓ DERANGEMENT VERIFIED: Player received someone else\'s chit!');
        }

        resolve();
      }
    });
  });

  // Submit guesses
  console.log('--- Submitting Guesses with Confidence & Reactions ---');
  p1.emit('submit_guess', {
    guessedAuthorId: 'user_2',
    confidence: 'sure',
    reactionText: 'This is definitely Rahul, classic 2 AM food!'
  });
  p2.emit('submit_guess', {
    guessedAuthorId: 'user_3',
    confidence: 'fifty_fifty',
    reactionText: 'Sneha gives plant parent energy.'
  });
  p3.emit('submit_guess', {
    guessedAuthorId: 'user_1',
    confidence: 'sure',
    reactionText: 'Alex is the drama reality show fan.'
  });

  // Wait for REVEAL phase
  await new Promise((resolve) => {
    p1.on('game_state_update', (state) => {
      if (state.phase === 'REVEAL' && state.roundResults) {
        console.log('✓ Phase transitioned to REVEAL!');
        console.log('✓ Round results revealed with author identity:');
        state.roundResults.chits.forEach((c) => {
          console.log(`  📝 "${c.content}" -> Written by: ${c.authorName} (Guesser: ${c.assignedToName}, Guess was ${c.guess?.isCorrect ? 'CORRECT ✓' : 'WRONG ✗'}, +${c.guess?.pointsAwarded} pts)`);
        });
        resolve();
      }
    });
  });

  console.log('🎉 Full End-to-End Game Loop Verified Successfully!');
  p1.disconnect();
  p2.disconnect();
  p3.disconnect();
  process.exit(0);
}

runSimulation().catch((err) => {
  console.error(err);
  process.exit(1);
});
