// ============================================
// FICHIER: server.js
// MODIFICATION À FAIRE
// ============================================

// CHERCHER CETTE LIGNE (environ ligne 2615-2619) :
// 
//   const report = buildEndReport(room, winner);
//   room.endReport = report;
//   setPhase(room, "GAME_OVER", { winner, report });
//   logEvent(room, "game_over", { winner });
//   logger.endGame(room.code, winner, Date.now() - room.startTime, room.players.size);
//   console.log(`[${room.code}] game_over winner=${winner}`);
// }


// REMPLACER PAR :

  const report = buildEndReport(room, winner);
  room.endReport = report;
  setPhase(room, "GAME_OVER", { winner, report });
  logEvent(room, "game_over", { winner });
  
  // ============================================
  // 🎮 SYSTÈME DE PARTIES JOUÉES + REWARDS + WORKFLOWS
  // ============================================
  
  // Pour chaque joueur de la partie (sauf ceux qui ont quitté)
  for (const p of room.players.values()) {
    if (p.status === "left") continue;
    
    try {
      // Chercher dans la DB par username
      const user = dbGet('SELECT id FROM users WHERE username = ?', [p.name]);
      if (user) {
        const userId = user.id;
        
        // 1. ENREGISTRER LA PARTIE DANS LA DB
        dbRun(`
          INSERT INTO games_played (user_id, ip_address, game_mode, played_at)
          VALUES (?, ?, ?, datetime('now'))
        `, [userId, 'socket_game', room.config.theme || 'default']);
        
        // 2. COMPTER LES PARTIES TOTALES DU JOUEUR
        const gamesCount = dbGet('SELECT COUNT(*) as count FROM games_played WHERE user_id = ?', [userId]);
        const totalGames = gamesCount ? gamesCount.count : 0;
        
        console.log(`[Parties] ${p.name} (user_id: ${userId}) a joué ${totalGames} partie(s)`);
        
        // 3. VÉRIFIER ET ATTRIBUER LES REWARDS AUTOMATIQUEMENT
        const rewardsToCheck = [
          { trigger: 'first_game', count: 1 },
          { trigger: '10_games', count: 10 },
          { trigger: '50_games', count: 50 },
          { trigger: '100_games', count: 100 }
        ];
        
        for (const rewardCheck of rewardsToCheck) {
          if (totalGames === rewardCheck.count) {
            // Trouver le reward actif pour ce trigger
            const reward = dbGet(`
              SELECT * FROM rewards 
              WHERE trigger_event = ? AND active = 1
            `, [rewardCheck.trigger]);
            
            if (reward) {
              // Vérifier si déjà reçu
              const alreadyReceived = dbGet(`
                SELECT * FROM user_rewards 
                WHERE user_id = ? AND reward_id = ?
              `, [userId, reward.id]);
              
              if (!alreadyReceived) {
                // ATTRIBUER LE REWARD !
                dbRun(`
                  UPDATE users 
                  SET bonus_avatars = COALESCE(bonus_avatars, 0) + ?,
                      video_credits = video_credits + ?
                  WHERE id = ?
                `, [reward.avatar_bonus || 0, reward.video_bonus || 0, userId]);
                
                // Marquer comme reçu
                dbRun(`
                  INSERT INTO user_rewards (user_id, reward_id, awarded_at)
                  VALUES (?, ?, datetime('now'))
                `, [userId, reward.id]);
                
                console.log(`🏆 [Reward] ${p.name} a reçu: ${reward.name} (+${reward.avatar_bonus} avatars, +${reward.video_bonus} crédits)`);
                
                // Créer une notification pop-up
                dbRun(`
                  INSERT INTO user_notifications (user_id, type, message, read, created_at)
                  VALUES (?, 'reward', ?, 0, ?)
                `, [userId, `🏆 ${reward.name} ! +${reward.avatar_bonus} avatars et +${reward.video_bonus} crédits vidéo !`, Date.now()]);
              }
            }
          }
        }
        
        // 4. DÉCLENCHER LE TRIGGER WORKFLOW "PARTIE JOUÉE"
        executeWorkflows('game_played', {
          user_id: userId,
          game_count: totalGames,
          game_mode: room.config.theme || 'default',
          winner: winner
        }).catch(err => {
          console.error('[Workflows] Erreur game_played:', err);
        });
      }
    } catch (error) {
      console.error('[Parties] Erreur enregistrement partie:', error);
    }
  }
  
  logger.endGame(room.code, winner, Date.now() - room.startTime, room.players.size);
  console.log(`[${room.code}] game_over winner=${winner}`);
}


// ============================================
// FIN DE LA MODIFICATION
// ============================================
