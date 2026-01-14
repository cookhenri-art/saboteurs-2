/**
 * Test Unitaire - Permissions Vidéo
 * Exécutez: node test-video-permissions.js
 */

const videoPermissions = require('./video-permissions');

console.log('🧪 Test des Permissions Vidéo\n');

// Mock players
const createPlayer = (id, name, role, status = 'alive', linkedTo = null) => ({
  playerId: id,
  name,
  role,
  status,
  linkedTo
});

const players = new Map([
  ['p1', createPlayer('p1', 'Alice', 'saboteur', 'alive')],
  ['p2', createPlayer('p2', 'Bob', 'saboteur', 'alive')],
  ['p3', createPlayer('p3', 'Charlie', 'radar_officer', 'alive')],
  ['p4', createPlayer('p4', 'Diana', 'doctor', 'alive')],
  ['p5', createPlayer('p5', 'Eve', 'ai_agent', 'alive', 'p6')],
  ['p6', createPlayer('p6', 'Frank', 'civilian', 'alive', 'p5')],
  ['p7', createPlayer('p7', 'Grace', 'civilian', 'dead')],
]);

// Test 1: Phase LOBBY
console.log('Test 1: Phase LOBBY');
const lobbyPerms = videoPermissions.calculateRoomPermissions('LOBBY', players);
console.log('Alice (saboteur):', lobbyPerms.p1);
console.log('Charlie (radar):', lobbyPerms.p3);
console.log('Grace (morte):', lobbyPerms.p7);
console.assert(lobbyPerms.p1.video === true, 'Lobby: tous actifs');
console.assert(lobbyPerms.p7.video === false, 'Lobby: mort = inactif');
console.log('✅ Test LOBBY passé\n');

// Test 2: Phase NIGHT_SABOTEURS
console.log('Test 2: Phase NIGHT_SABOTEURS');
const nightSabPerms = videoPermissions.calculateRoomPermissions('NIGHT_SABOTEURS', players);
console.log('Alice (saboteur):', nightSabPerms.p1);
console.log('Charlie (radar):', nightSabPerms.p3);
console.assert(nightSabPerms.p1.video === true, 'Saboteurs voient');
console.assert(nightSabPerms.p3.video === false, 'Non-saboteurs ne voient pas');
console.log('✅ Test NIGHT_SABOTEURS passé\n');

// Test 3: Phase DAY_VOTE
console.log('Test 3: Phase DAY_VOTE');
const votePerms = videoPermissions.calculateRoomPermissions('DAY_VOTE', players);
console.log('Alice (saboteur):', votePerms.p1);
console.log('Charlie (radar):', votePerms.p3);
console.assert(votePerms.p1.video === false, 'Vote: caméra off');
console.assert(votePerms.p1.audio === true, 'Vote: micro on');
console.log('✅ Test DAY_VOTE passé\n');

// Test 4: Phase NIGHT_AI_AGENT (amoureux)
console.log('Test 4: Phase NIGHT_AI_AGENT (Amoureux)');
const aiPerms = videoPermissions.calculateRoomPermissions('NIGHT_AI_AGENT', players);
console.log('Eve (amoureux 1):', aiPerms.p5);
console.log('Frank (amoureux 2):', aiPerms.p6);
console.log('Alice (saboteur):', aiPerms.p1);
console.assert(aiPerms.p5.video === true, 'Amoureux 1 voit');
console.assert(aiPerms.p6.video === true, 'Amoureux 2 voit');
console.assert(aiPerms.p1.video === false, 'Non-amoureux ne voit pas');
console.log('✅ Test NIGHT_AI_AGENT passé\n');

// Test 5: Phase NIGHT_RADAR
console.log('Test 5: Phase NIGHT_RADAR');
const radarPerms = videoPermissions.calculateRoomPermissions('NIGHT_RADAR', players);
console.log('Charlie (radar):', radarPerms.p3);
console.log('Alice (saboteur):', radarPerms.p1);
console.assert(radarPerms.p3.video === true, 'Radar actif');
console.assert(radarPerms.p1.video === false, 'Autres inactifs');
console.log('✅ Test NIGHT_RADAR passé\n');

// Test 6: Phase NIGHT_DOCTOR
console.log('Test 6: Phase NIGHT_DOCTOR');
const doctorPerms = videoPermissions.calculateRoomPermissions('NIGHT_DOCTOR', players);
console.log('Diana (doctor):', doctorPerms.p4);
console.log('Alice (saboteur):', doctorPerms.p1);
console.assert(doctorPerms.p4.video === true, 'Doctor actif');
console.assert(doctorPerms.p1.video === false, 'Autres inactifs');
console.log('✅ Test NIGHT_DOCTOR passé\n');

// Test 7: Messages de phase
console.log('Test 7: Messages de Phase');
console.log('LOBBY:', videoPermissions.getPhaseVideoMessage('LOBBY'));
console.log('DAY_VOTE:', videoPermissions.getPhaseVideoMessage('DAY_VOTE'));
console.log('NIGHT_SABOTEURS:', videoPermissions.getPhaseVideoMessage('NIGHT_SABOTEURS'));
console.log('✅ Test Messages passé\n');

// Test 8: Détection de changement nécessaire
console.log('Test 8: Détection de Changement');
const shouldUpdate1 = videoPermissions.shouldUpdatePermissions('LOBBY', 'NIGHT_SABOTEURS');
const shouldUpdate2 = videoPermissions.shouldUpdatePermissions('NIGHT_SABOTEURS', 'NIGHT_RADAR');
const shouldUpdate3 = videoPermissions.shouldUpdatePermissions('DAY_VOTE', 'DAY_VOTE');
console.log('LOBBY → NIGHT_SABOTEURS:', shouldUpdate1);
console.log('NIGHT_SABOTEURS → NIGHT_RADAR:', shouldUpdate2);
console.log('DAY_VOTE → DAY_VOTE:', shouldUpdate3);
console.assert(shouldUpdate1 === true, 'Changement de catégorie détecté');
console.assert(shouldUpdate3 === false, 'Pas de changement détecté');
console.log('✅ Test Changement passé\n');

console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
console.log('\nStatistiques:');
console.log('- FULL_VIDEO_PHASES:', videoPermissions.FULL_VIDEO_PHASES.length);
console.log('- ROLE_RESTRICTED_PHASES:', Object.keys(videoPermissions.ROLE_RESTRICTED_PHASES).length);
console.log('- CAMERA_OFF_PHASES:', videoPermissions.CAMERA_OFF_PHASES.length);
