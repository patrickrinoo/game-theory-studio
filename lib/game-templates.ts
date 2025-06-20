import { GameTemplate, GameType, Strategy, PlayerBehavior } from './game-theory-types'

// Strategy definitions for common games
const binaryStrategies: Strategy[] = [
  {
    id: 'cooperate',
    name: 'Cooperate',
    description: 'Work together for mutual benefit',
    shortName: 'C'
  },
  {
    id: 'defect',
    name: 'Defect',
    description: 'Act in self-interest',
    shortName: 'D'
  }
]

const battleOfSexesStrategies: Strategy[] = [
  {
    id: 'football',
    name: 'Football',
    description: 'Prefer watching football',
    shortName: 'F'
  },
  {
    id: 'opera',
    name: 'Opera',
    description: 'Prefer watching opera',
    shortName: 'O'
  }
]

const chickenStrategies: Strategy[] = [
  {
    id: 'swerve',
    name: 'Swerve',
    description: 'Avoid confrontation by backing down',
    shortName: 'S'
  },
  {
    id: 'straight',
    name: 'Straight',
    description: 'Continue straight ahead',
    shortName: 'St'
  }
]

const stagHuntStrategies: Strategy[] = [
  {
    id: 'stag',
    name: 'Hunt Stag',
    description: 'Hunt the stag (requires cooperation)',
    shortName: 'S'
  },
  {
    id: 'hare',
    name: 'Hunt Hare',
    description: 'Hunt hare (safe individual choice)',
    shortName: 'H'
  }
]

const hawkDoveStrategies: Strategy[] = [
  {
    id: 'hawk',
    name: 'Hawk',
    description: 'Aggressive strategy - fight until winner',
    shortName: 'H'
  },
  {
    id: 'dove',
    name: 'Dove',
    description: 'Peaceful strategy - share or retreat',
    shortName: 'D'
  }
]

const matchingPenniesStrategies: Strategy[] = [
  {
    id: 'heads',
    name: 'Heads',
    description: 'Choose heads',
    shortName: 'H'
  },
  {
    id: 'tails',
    name: 'Tails',
    description: 'Choose tails',
    shortName: 'T'
  }
]

// Game templates with payoff matrices
export const GAME_TEMPLATES: Record<GameType, GameTemplate> = {
  [GameType.PRISONERS_DILEMMA]: {
    type: GameType.PRISONERS_DILEMMA,
    name: "Prisoner's Dilemma",
    description: "Two prisoners must decide whether to cooperate or defect without communication",
    strategies: binaryStrategies,
    // Payoff matrix: [Cooperate-Cooperate, Cooperate-Defect, Defect-Cooperate, Defect-Defect]
    payoffMatrix: [
      [
        [3, 3], // Both cooperate
        [0, 5]  // P1 cooperates, P2 defects
      ],
      [
        [5, 0], // P1 defects, P2 cooperates
        [1, 1]  // Both defect
      ]
    ],
    defaultPlayers: [
      { 
        name: 'Prisoner A',
        behavior: PlayerBehavior.RATIONAL,
        color: '#3b82f6'
      },
      { 
        name: 'Prisoner B',
        behavior: PlayerBehavior.RATIONAL,
        color: '#ef4444'
      }
    ],
    realWorldExample: "Trade negotiations, arms races, environmental agreements, tax compliance",
    educationalNote: "Demonstrates how rational individual decisions can lead to suboptimal collective outcomes"
  },

  [GameType.BATTLE_OF_SEXES]: {
    type: GameType.BATTLE_OF_SEXES,
    name: "Battle of the Sexes",
    description: "Coordination game where players prefer being together but disagree on the activity",
    strategies: battleOfSexesStrategies,
    payoffMatrix: [
      [
        [2, 1], // Both choose football
        [0, 0]  // Football vs Opera
      ],
      [
        [0, 0], // Opera vs Football
        [1, 2]  // Both choose opera
      ]
    ],
    defaultPlayers: [
      { 
        name: 'Player 1',
        behavior: PlayerBehavior.RATIONAL,
        color: '#8b5cf6'
      },
      { 
        name: 'Player 2',
        behavior: PlayerBehavior.RATIONAL,
        color: '#06b6d4'
      }
    ],
    realWorldExample: "Technology standards adoption, meeting location decisions, entertainment choices",
    educationalNote: "Shows coordination problems with multiple Nash equilibria and the role of communication"
  },

  [GameType.CHICKEN_GAME]: {
    type: GameType.CHICKEN_GAME,
    name: "Chicken Game",
    description: "Game of brinkmanship where backing down is costly but collision is catastrophic",
    strategies: chickenStrategies,
    payoffMatrix: [
      [
        [0, 0],   // Both swerve
        [-1, 1]   // P1 swerves, P2 straight
      ],
      [
        [1, -1],  // P1 straight, P2 swerves
        [-10, -10] // Both go straight (collision)
      ]
    ],
    defaultPlayers: [
      { 
        name: 'Driver A',
        behavior: PlayerBehavior.AGGRESSIVE,
        color: '#f59e0b'
      },
      { 
        name: 'Driver B',
        behavior: PlayerBehavior.AGGRESSIVE,
        color: '#10b981'
      }
    ],
    realWorldExample: "Nuclear deterrence, trade wars, political standoffs, price wars",
    educationalNote: "Illustrates escalation dynamics and the tension between credible threats and catastrophic outcomes"
  },

  [GameType.STAG_HUNT]: {
    type: GameType.STAG_HUNT,
    name: "Stag Hunt",
    description: "Cooperation game where mutual cooperation yields the highest payoff but trust is required",
    strategies: stagHuntStrategies,
    payoffMatrix: [
      [
        [3, 3], // Both hunt stag
        [0, 2]  // P1 hunts stag, P2 hunts hare
      ],
      [
        [2, 0], // P1 hunts hare, P2 hunts stag
        [1, 1]  // Both hunt hare
      ]
    ],
    defaultPlayers: [
      { 
        name: 'Hunter 1',
        behavior: PlayerBehavior.COOPERATIVE,
        color: '#059669'
      },
      { 
        name: 'Hunter 2',
        behavior: PlayerBehavior.COOPERATIVE,
        color: '#7c3aed'
      }
    ],
    realWorldExample: "Team projects, international cooperation, technological innovation, social movements",
    educationalNote: "Demonstrates the assurance problem and how trust enables superior collective outcomes"
  },

  [GameType.HAWK_DOVE]: {
    type: GameType.HAWK_DOVE,
    name: "Hawk-Dove Game",
    description: "Contest over resources where aggressive and peaceful strategies compete",
    strategies: hawkDoveStrategies,
    payoffMatrix: [
      [
        [-1, -1], // Both hawks (costly fight)
        [3, 1]    // Hawk vs Dove
      ],
      [
        [1, 3],   // Dove vs Hawk
        [2, 2]    // Both doves (share)
      ]
    ],
    defaultPlayers: [
      { 
        name: 'Competitor A',
        behavior: PlayerBehavior.AGGRESSIVE,
        color: '#dc2626'
      },
      { 
        name: 'Competitor B',
        behavior: PlayerBehavior.COOPERATIVE,
        color: '#2563eb'
      }
    ],
    realWorldExample: "Animal territorial disputes, business competition, resource allocation, conflict resolution",
    educationalNote: "Models the evolution of aggressive vs peaceful behaviors in competitive environments"
  },

  [GameType.MATCHING_PENNIES]: {
    type: GameType.MATCHING_PENNIES,
    name: "Matching Pennies",
    description: "Zero-sum game where one player wins what the other loses",
    strategies: matchingPenniesStrategies,
    payoffMatrix: [
      [
        [1, -1],  // Both heads (P1 wins)
        [-1, 1]   // Heads vs Tails (P2 wins)
      ],
      [
        [-1, 1],  // Tails vs Heads (P2 wins)
        [1, -1]   // Both tails (P1 wins)
      ]
    ],
    defaultPlayers: [
      { 
        name: 'Player 1',
        behavior: PlayerBehavior.RANDOM,
        color: '#f97316'
      },
      { 
        name: 'Player 2',
        behavior: PlayerBehavior.RANDOM,
        color: '#84cc16'
      }
    ],
    realWorldExample: "Market competition, sports strategy, hide-and-seek scenarios, security games",
    educationalNote: "Pure zero-sum game with no pure strategy Nash equilibrium, requiring mixed strategies"
  },

  [GameType.COORDINATION]: {
    type: GameType.COORDINATION,
    name: "Pure Coordination",
    description: "Players want to coordinate on the same action but have no preference which one",
    strategies: battleOfSexesStrategies, // Reusing for simplicity
    payoffMatrix: [
      [
        [1, 1], // Both choose option A
        [0, 0]  // Miscoordination
      ],
      [
        [0, 0], // Miscoordination
        [1, 1]  // Both choose option B
      ]
    ],
    defaultPlayers: [
      { 
        name: 'Agent 1',
        behavior: PlayerBehavior.RATIONAL,
        color: '#6366f1'
      },
      { 
        name: 'Agent 2',
        behavior: PlayerBehavior.RATIONAL,
        color: '#ec4899'
      }
    ],
    realWorldExample: "Language conventions, driving side of road, technology standards, meeting times",
    educationalNote: "Shows pure coordination problems and the role of focal points and conventions"
  },

  [GameType.PUBLIC_GOODS]: {
    type: GameType.PUBLIC_GOODS,
    name: "Public Goods Game",
    description: "Multi-player game where contributing to public goods benefits everyone but costs the contributor",
    strategies: [
      {
        id: 'contribute',
        name: 'Contribute',
        description: 'Pay cost to provide public benefit',
        shortName: 'C'
      },
      {
        id: 'free_ride',
        name: 'Free Ride',
        description: 'Benefit without contributing',
        shortName: 'F'
      }
    ],
    payoffMatrix: [
      [
        [1, 1], // Both contribute
        [-1, 2] // P1 contributes, P2 free rides
      ],
      [
        [2, -1], // P1 free rides, P2 contributes
        [0, 0]   // Both free ride
      ]
    ],
    defaultPlayers: [
      { 
        name: 'Citizen 1',
        behavior: PlayerBehavior.COOPERATIVE,
        color: '#0891b2'
      },
      { 
        name: 'Citizen 2',
        behavior: PlayerBehavior.RATIONAL,
        color: '#be185d'
      }
    ],
    realWorldExample: "Taxation, environmental protection, open source software, public broadcasting",
    educationalNote: "Illustrates the free rider problem and challenges in providing collective goods"
  },

  [GameType.CUSTOM]: {
    type: GameType.CUSTOM,
    name: "Custom Game",
    description: "User-defined game with customizable strategies and payoffs",
    strategies: [
      {
        id: 'strategy1',
        name: 'Strategy 1',
        description: 'First strategy option',
        shortName: 'S1'
      },
      {
        id: 'strategy2',
        name: 'Strategy 2',
        description: 'Second strategy option',
        shortName: 'S2'
      }
    ],
    payoffMatrix: [
      [
        [1, 1], // Both choose strategy 1
        [0, 0]  // S1 vs S2
      ],
      [
        [0, 0], // S2 vs S1
        [1, 1]  // Both choose strategy 2
      ]
    ],
    defaultPlayers: [
      { 
        name: 'Player 1',
        behavior: PlayerBehavior.RATIONAL,
        color: '#64748b'
      },
      { 
        name: 'Player 2',
        behavior: PlayerBehavior.RATIONAL,
        color: '#78716c'
      }
    ],
    realWorldExample: "Any custom scenario defined by the user",
    educationalNote: "Flexible template for exploring user-defined strategic interactions"
  }
}

// Utility functions for working with game templates
export class GameTemplateUtils {
  static getTemplate(gameType: GameType): GameTemplate {
    return GAME_TEMPLATES[gameType]
  }

  static getAllTemplates(): GameTemplate[] {
    return Object.values(GAME_TEMPLATES)
  }

  static getTemplatesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): GameTemplate[] {
    // Define difficulty levels
    const difficultyMap = {
      beginner: [GameType.PRISONERS_DILEMMA, GameType.COORDINATION, GameType.STAG_HUNT],
      intermediate: [GameType.BATTLE_OF_SEXES, GameType.CHICKEN_GAME, GameType.HAWK_DOVE],
      advanced: [GameType.MATCHING_PENNIES, GameType.PUBLIC_GOODS, GameType.CUSTOM]
    }

    return difficultyMap[difficulty].map(type => GAME_TEMPLATES[type])
  }

  static validateGameTemplate(template: GameTemplate): boolean {
    // Basic validation
    if (!template.strategies || template.strategies.length < 2) return false
    if (!template.payoffMatrix || template.payoffMatrix.length === 0) return false
    
    // Check matrix dimensions
    const numStrategies = template.strategies.length
    if (template.payoffMatrix.length !== numStrategies) return false
    
    for (const row of template.payoffMatrix) {
      if (row.length !== numStrategies) return false
      for (const cell of row) {
        if (!Array.isArray(cell) || cell.length < 2) return false
      }
    }

    return true
  }

  static createCustomTemplate(
    name: string,
    description: string,
    strategies: Strategy[],
    payoffMatrix: number[][][]
  ): GameTemplate {
    return {
      type: GameType.CUSTOM,
      name,
      description,
      strategies,
      payoffMatrix,
      defaultPlayers: [
        { name: 'Player 1', behavior: PlayerBehavior.RATIONAL, color: '#3b82f6' },
        { name: 'Player 2', behavior: PlayerBehavior.RATIONAL, color: '#ef4444' }
      ],
      realWorldExample: 'Custom scenario',
      educationalNote: 'User-defined strategic interaction'
    }
  }
} 