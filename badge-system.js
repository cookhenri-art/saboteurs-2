/**
 * Système de badges de progression
 * Badges persistants stockés dans badges.json
 */

const fs = require("fs");
const path = require("path");

class BadgeSystem {
  constructor(dataDir) {
    this.badgesFile = path.join(dataDir, "badges.json");
    this.db = this.load();
  }

  load() {
    try {
      if (!fs.existsSync(this.badgesFile)) return {};
      return JSON.parse(fs.readFileSync(this.badgesFile, "utf-8")) || {};
    } catch {
      return {};
    }
  }

  save() {
    try {
      fs.writeFileSync(this.badgesFile, JSON.stringify(this.db, null, 2), "utf-8");
    } catch (e) {
      console.error("[badges] save error", e);
    }
  }

  // Définitions des badges
  getBadgeDefinitions() {
    return {
      saboteur_streak_3: {
        id: "saboteur_streak_3",
        name: "Saboteur implacable",
        description: "3 victoires saboteurs d'affilée",
        icon: "🔥"
      },
      perfect_doctor: {
        id: "perfect_doctor",
        name: "Docteur parfait",
        description: "5+ saves sans aucun kill",
        icon: "⚕️"
      },
      radar_master: {
        id: "radar_master",
        name: "Radar implacable",
        description: "10+ inspections avec 90%+ de précision",
        icon: "📡"
      },
      decisive_captain: {
        id: "decisive_captain",
        name: "Capitaine décisif",
        description: "Élu capitaine 5+ fois",
        icon: "⭐"
      },
      ghost_saboteur: {
        id: "ghost_saboteur",
        name: "Saboteur fantôme",
        description: "Victoire saboteur sans être jamais suspecté en vote",
        icon: "👻"
      },
      astronaut_streak_3: {
        id: "astronaut_streak_3",
        name: "Astronaute vigilant",
        description: "3 victoires astronautes d'affilée",
        icon: "🚀"
      },
      ai_cupid: {
        id: "ai_cupid",
        name: "Cupidon IA",
        description: "Link 10+ paires d'agents IA",
        icon: "💕"
      },
      security_avenger: {
        id: "security_avenger",
        name: "Vengeur implacable",
        description: "5+ kills en revenge shot",
        icon: "⚔️"
      },
      chameleon_master: {
        id: "chameleon_master",
        name: "Maître du déguisement",
        description: "10+ swaps caméléon",
        icon: "🦎"
      },
      veteran_player: {
        id: "veteran_player",
        name: "Vétéran spatial",
        description: "100+ parties jouées",
        icon: "🎖️"
      }
    };
  }

  // Obtenir les badges d'un joueur
  getPlayerBadges(playerName) {
    if (!this.db[playerName]) {
      this.db[playerName] = { badges: [], earnedAt: {} };
    }
    return this.db[playerName].badges;
  }

  // Ajouter un badge à un joueur
  awardBadge(playerName, badgeId) {
    if (!this.db[playerName]) {
      this.db[playerName] = { badges: [], earnedAt: {} };
    }
    
    if (!this.db[playerName].badges.includes(badgeId)) {
      this.db[playerName].badges.push(badgeId);
      this.db[playerName].earnedAt[badgeId] = new Date().toISOString();
      this.save();
      return true;
    }
    return false;
  }

  // Vérifier les conditions de badges pour un joueur après une partie
  checkAndAwardBadges(playerName, stats, matchHistory = []) {
    const newBadges = [];

    // Saboteur implacable (3 victoires saboteurs d'affilée)
    if (this.checkSaboteurStreak(matchHistory, playerName, 3)) {
      if (this.awardBadge(playerName, "saboteur_streak_3")) {
        newBadges.push("saboteur_streak_3");
      }
    }

    // Astronaute vigilant (3 victoires astronautes d'affilée)
    if (this.checkAstronautStreak(matchHistory, playerName, 3)) {
      if (this.awardBadge(playerName, "astronaut_streak_3")) {
        newBadges.push("astronaut_streak_3");
      }
    }

    // Docteur parfait (5+ saves sans kill)
    if (stats.doctorSaves >= 5 && stats.doctorKills === 0) {
      if (this.awardBadge(playerName, "perfect_doctor")) {
        newBadges.push("perfect_doctor");
      }
    }

    // Radar implacable (10+ inspections avec 90%+ précision)
    if (stats.radarInspects >= 10) {
      const accuracy = stats.radarInspects > 0 ? stats.radarCorrect / stats.radarInspects : 0;
      if (accuracy >= 0.9) {
        if (this.awardBadge(playerName, "radar_master")) {
          newBadges.push("radar_master");
        }
      }
    }

    // Capitaine décisif (5+ élections)
    const captainElections = stats.captainElected || 0;
    if (captainElections >= 5) {
      if (this.awardBadge(playerName, "decisive_captain")) {
        newBadges.push("decisive_captain");
      }
    }

    // Vengeur implacable (5+ revenge kills)
    if (stats.securityRevengeShots >= 5) {
      if (this.awardBadge(playerName, "security_avenger")) {
        newBadges.push("security_avenger");
      }
    }

    // Maître du déguisement (10+ swaps)
    if (stats.chameleonSwaps >= 10) {
      if (this.awardBadge(playerName, "chameleon_master")) {
        newBadges.push("chameleon_master");
      }
    }

    // Link AI (10+ links)
    const aiLinks = stats.aiAgentLinks || 0;
    if (aiLinks >= 10) {
      if (this.awardBadge(playerName, "ai_cupid")) {
        newBadges.push("ai_cupid");
      }
    }

    // Vétéran (100+ parties)
    if (stats.gamesPlayed >= 100) {
      if (this.awardBadge(playerName, "veteran_player")) {
        newBadges.push("veteran_player");
      }
    }

    return newBadges;
  }

  // Vérifier streak saboteurs
  checkSaboteurStreak(matchHistory, playerName, streakLength) {
    if (!matchHistory || matchHistory.length < streakLength) return false;
    
    // Prendre les N dernières parties
    const recent = matchHistory.slice(-streakLength);
    
    return recent.every(match => {
      return match.playerName === playerName &&
             match.role === "saboteur" &&
             match.won === true;
    });
  }

  // Vérifier streak astronautes
  checkAstronautStreak(matchHistory, playerName, streakLength) {
    if (!matchHistory || matchHistory.length < streakLength) return false;
    
    const recent = matchHistory.slice(-streakLength);
    
    return recent.every(match => {
      return match.playerName === playerName &&
             match.role !== "saboteur" &&
             match.won === true;
    });
  }
}

module.exports = BadgeSystem;
