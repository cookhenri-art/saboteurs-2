/**
 * Gestionnaire de thèmes
 * Charge et gère les différents thèmes du jeu
 */

const fs = require("fs");
const path = require("path");

class ThemeManager {
  constructor(themesDir) {
    this.themesDir = themesDir;
    this.themes = new Map();
    this.loadThemes();
  }

  loadThemes() {
    if (!fs.existsSync(this.themesDir)) {
      console.error(`[themes] Directory not found: ${this.themesDir}`);
      return;
    }

    const files = fs.readdirSync(this.themesDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const filePath = path.join(this.themesDir, file);
        const theme = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        if (theme.id) {
          this.themes.set(theme.id, theme);
          console.log(`[themes] Loaded: ${theme.id} - ${theme.name}`);
        }
      } catch (e) {
        console.error(`[themes] Error loading ${file}:`, e.message);
      }
    }

    // S'assurer qu'on a au moins le thème par défaut
    if (!this.themes.has('default')) {
      console.warn('[themes] Default theme missing, creating fallback');
      this.themes.set('default', this.createFallbackTheme());
    }
  }

  createFallbackTheme() {
    return {
      id: 'default',
      name: 'Infiltration Spatiale',
      homeTitle: 'INFILTRATION SPATIALE',
      description: 'Thème par défaut',
      roles: {
        saboteur: { name: 'Saboteur', namePlural: 'Saboteurs', description: 'Infiltrés' },
        astronaut: { name: 'Astronaute', namePlural: 'Astronautes', description: 'Équipage' },
        radar: { name: 'Officier Radar', description: 'Inspecteur' },
        doctor: { name: 'Docteur Bio', description: 'Soigneur' },
        security: { name: 'Chef de Sécurité', description: 'Vengeur' },
        ai_agent: { name: 'Agent IA', description: 'Lien' },
        engineer: { name: 'Ingénieur', description: 'Simple astronaute' },
        chameleon: { name: 'Caméléon', description: 'Échangeur' }
      },
      phases: {},
      audio: {},
      images: {},
      cssVars: {}
    };
  }

  getTheme(themeId) {
    return this.themes.get(themeId) || this.themes.get('default');
  }

  getAllThemes() {
    // Retourner les thèmes complets avec roles, terms, phases pour les traductions côté client
    return Array.from(this.themes.values()).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      roles: t.roles,      // ✅ AJOUTÉ : Nécessaire pour tRole()
      terms: t.terms,      // ✅ AJOUTÉ : Nécessaire pour t()
      phases: t.phases     // ✅ AJOUTÉ : Pour les phases traduites
    }));
  }

  getRoleName(themeId, roleKey, plural = false) {
    const theme = this.getTheme(themeId);
    const role = theme.roles[roleKey];
    if (!role) return roleKey;
    return plural ? (role.namePlural || role.name) : role.name;
  }

  getRoleDescription(themeId, roleKey) {
    const theme = this.getTheme(themeId);
    const role = theme.roles[roleKey];
    return role?.description || '';
  }

  getPhaseText(themeId, phaseKey) {
    const theme = this.getTheme(themeId);
    return theme.phases[phaseKey] || phaseKey;
  }

  getAudioKey(themeId, audioKey) {
    const theme = this.getTheme(themeId);
    return theme.audio[audioKey] || audioKey;
  }

  getCssVars(themeId) {
    const theme = this.getTheme(themeId);
    return theme.cssVars || {};
  }

  getHomeTitle(themeId) {
    const theme = this.getTheme(themeId);
    return theme.homeTitle || theme.name || 'INFILTRATION SPATIALE';
  }
}

module.exports = ThemeManager;
