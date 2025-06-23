import { GameType } from './game-theory-types'

export interface EducationalConcept {
  id: string
  title: string
  shortDescription: string
  detailedExplanation: string
  examples: string[]
  realWorldApplications: string[]
  keyTakeaways: string[]
  relatedConcepts: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: 'strategy' | 'equilibrium' | 'payoff' | 'behavior' | 'simulation'
}

export interface GameEducationalContent {
  gameType: GameType
  overview: string
  keyCharacteristics: string[]
  strategicInsights: string[]
  commonMistakes: string[]
  realWorldExamples: string[]
  learningObjectives: string[]
  prerequisites: string[]
  nextSteps: string[]
}

export interface TutorialStep {
  id: string
  title: string
  description: string
  targetElement?: string
  action?: 'click' | 'hover' | 'input' | 'scroll'
  content: string
  tips?: string[]
  skipCondition?: string
}

export interface Tutorial {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number // in minutes
  prerequisites: string[]
  steps: TutorialStep[]
  completionCriteria: string[]
}

// Educational concepts library
export const EDUCATIONAL_CONCEPTS: Record<string, EducationalConcept> = {
  NASH_EQUILIBRIUM: {
    id: 'nash-equilibrium',
    title: 'Nash Equilibrium',
    shortDescription: 'A solution concept where no player can benefit by changing their strategy unilaterally',
    detailedExplanation: 'A Nash equilibrium represents a state where each player\'s strategy is optimal given the strategies of all other players. At this point, no player has an incentive to deviate from their current strategy, assuming all other players maintain theirs. This concept is fundamental to game theory and helps predict outcomes in strategic interactions.',
    examples: [
      'In Prisoner\'s Dilemma, (Defect, Defect) is a Nash equilibrium',
      'In Battle of the Sexes, there are two pure strategy Nash equilibria',
      'Mixed strategy equilibria in Matching Pennies where each player randomizes 50-50'
    ],
    realWorldApplications: [
      'Market competition and pricing strategies',
      'International relations and arms races',
      'Traffic flow and route selection',
      'Auction design and bidding strategies'
    ],
    keyTakeaways: [
      'Nash equilibria may not always be socially optimal',
      'Games can have zero, one, or multiple Nash equilibria',
      'Mixed strategies allow for equilibria in pure coordination failures'
    ],
    relatedConcepts: ['dominant-strategy', 'pareto-efficiency', 'mixed-strategy'],
    difficulty: 'intermediate',
    category: 'equilibrium'
  },

  DOMINANT_STRATEGY: {
    id: 'dominant-strategy',
    title: 'Dominant Strategy',
    shortDescription: 'A strategy that yields the best outcome regardless of what opponents do',
    detailedExplanation: 'A dominant strategy is one that provides the highest payoff for a player regardless of the strategies chosen by other players. Strictly dominant strategies always outperform any other strategy, while weakly dominant strategies perform at least as well as any alternative. Identifying dominant strategies simplifies decision-making and can help predict rational behavior.',
    examples: [
      'In Prisoner\'s Dilemma, Defect dominates Cooperate for both players',
      'In some auctions, truthful bidding is a dominant strategy',
      'Price matching in retail can be a dominant strategy'
    ],
    realWorldApplications: [
      'Corporate strategy in competitive markets',
      'Political campaign strategies',
      'Investment and portfolio decisions',
      'Emergency response protocols'
    ],
    keyTakeaways: [
      'Rational players should always choose dominant strategies when they exist',
      'Dominant strategy equilibria are highly predictable',
      'Not all games have dominant strategies'
    ],
    relatedConcepts: ['nash-equilibrium', 'rationality', 'strategic-dominance'],
    difficulty: 'beginner',
    category: 'strategy'
  },

  MIXED_STRATEGY: {
    id: 'mixed-strategy',
    title: 'Mixed Strategy',
    shortDescription: 'A strategy that involves randomizing between different pure strategies',
    detailedExplanation: 'A mixed strategy involves probabilistically choosing between different pure strategies rather than committing to a single action. Players use mixed strategies when no pure strategy Nash equilibrium exists, or when randomization provides strategic advantage by keeping opponents uncertain. The key insight is that players must be indifferent between their pure strategies for mixing to be optimal.',
    examples: [
      'In Matching Pennies, both players mix 50-50 between Heads and Tails',
      'Soccer penalty kicks: randomize kick direction',
      'Military strategies: unpredictable attack patterns'
    ],
    realWorldApplications: [
      'Sports strategy and play-calling',
      'Security and patrol scheduling',
      'Marketing and advertising timing',
      'Financial portfolio diversification'
    ],
    keyTakeaways: [
      'Mixed strategies make players unpredictable',
      'Optimal mixing probabilities depend on opponent payoffs',
      'Players must be indifferent between mixed strategies at equilibrium'
    ],
    relatedConcepts: ['nash-equilibrium', 'pure-strategy', 'randomization'],
    difficulty: 'advanced',
    category: 'strategy'
  },

  PARETO_EFFICIENCY: {
    id: 'pareto-efficiency',
    title: 'Pareto Efficiency',
    shortDescription: 'An outcome where no player can be made better off without making another worse off',
    detailedExplanation: `Pareto efficiency represents allocations where it's impossible to improve one player's payoff without reducing another's. While Nash equilibria focus on individual rationality, Pareto efficiency concerns collective welfare. Many games feature conflicts between these concepts, highlighting tensions between individual and social optimality.`,
    examples: [
      'In Prisoner\'s Dilemma, (Cooperate, Cooperate) is Pareto efficient but not Nash',
      'Coordination games often have multiple Pareto efficient outcomes',
      'Trade agreements that benefit all parties'
    ],
    realWorldApplications: [
      'Economic policy design',
      'International trade negotiations',
      'Resource allocation in organizations',
      'Environmental agreements'
    ],
    keyTakeaways: [
      'Nash equilibria are not always Pareto efficient',
      'Multiple Pareto efficient outcomes may exist',
      'Social dilemmas arise when individual and group interests conflict'
    ],
    relatedConcepts: ['nash-equilibrium', 'social-optimum', 'cooperation'],
    difficulty: 'intermediate',
    category: 'equilibrium'
  },

  MONTE_CARLO_SIMULATION: {
    id: 'monte-carlo-simulation',
    title: 'Monte Carlo Simulation',
    shortDescription: 'A computational method using repeated random sampling to obtain numerical results',
    detailedExplanation: `Monte Carlo simulation uses random sampling to explore the behavior of complex systems. In game theory, it helps analyze scenarios with uncertainty, mixed strategies, or evolutionary dynamics. By running thousands of iterations with random strategy choices, we can estimate equilibrium behavior, convergence patterns, and outcome distributions that are difficult to calculate analytically.`,
    examples: [
      'Simulating mixed strategy equilibria in complex games',
      'Analyzing evolutionary stability of strategies',
      'Estimating payoff distributions in uncertain environments'
    ],
    realWorldApplications: [
      'Financial risk assessment and portfolio optimization',
      'Climate modeling and weather prediction',
      'Nuclear physics and particle interactions',
      'Supply chain and logistics optimization'
    ],
    keyTakeaways: [
      'More iterations generally provide more accurate estimates',
      'Random sampling can reveal emergent patterns',
      'Useful for analyzing complex, multi-agent interactions'
    ],
    relatedConcepts: ['probability', 'convergence', 'statistical-analysis'],
    difficulty: 'intermediate',
    category: 'simulation'
  }
}

// Game-specific educational content
export const GAME_EDUCATIONAL_CONTENT: Record<GameType, GameEducationalContent> = {
  [GameType.PRISONERS_DILEMMA]: {
    gameType: GameType.PRISONERS_DILEMMA,
    overview: 'The Prisoner\'s Dilemma illustrates the conflict between individual rationality and collective benefit. Two prisoners must decide whether to cooperate or defect without communication.',
    keyCharacteristics: [
      'Simultaneous decision-making without communication',
      'Dominant strategy (Defect) leads to suboptimal outcome',
      'Individual rationality conflicts with social optimality',
      'Classic example of a social dilemma'
    ],
    strategicInsights: [
      'Defection is the dominant strategy for both players',
      'Nash equilibrium (Defect, Defect) is Pareto inefficient',
      'Cooperation would benefit both players but is unstable',
      'Repetition can enable cooperative behavior'
    ],
    commonMistakes: [
      'Assuming cooperation is always rational',
      'Ignoring the incentive to defect',
      'Confusing one-shot vs. repeated games',
      'Overlooking the role of communication'
    ],
    realWorldExamples: [
      'Arms races between nations',
      'Environmental protection vs. economic development',
      'Free riding in public goods provision',
      'Price competition between firms'
    ],
    learningObjectives: [
      'Understand dominant strategies and Nash equilibrium',
      'Recognize social dilemmas in real-world situations',
      'Appreciate the tension between individual and collective rationality',
      'Learn how institutions can promote cooperation'
    ],
    prerequisites: ['basic-game-theory', 'payoff-matrices'],
    nextSteps: ['repeated-games', 'public-goods-games', 'evolutionary-dynamics']
  },

  [GameType.BATTLE_OF_SEXES]: {
    gameType: GameType.BATTLE_OF_SEXES,
    overview: 'A coordination game where players benefit from matching actions but disagree on which outcome to coordinate on.',
    keyCharacteristics: [
      'Two pure strategy Nash equilibria',
      'Coordination problem with distributional conflict',
      'Players prefer being together but disagree on activity',
      'Demonstrates importance of communication and commitment'
    ],
    strategicInsights: [
      'Multiple equilibria create coordination challenges',
      'Mixed strategy equilibrium exists but yields lower payoffs',
      'First-mover advantage can solve coordination problem',
      'Communication and pre-commitment are valuable'
    ],
    commonMistakes: [
      'Focusing only on pure strategy equilibria',
      'Ignoring the mixed strategy equilibrium',
      'Underestimating coordination difficulties',
      'Not considering sequential versions of the game'
    ],
    realWorldExamples: [
      'Technology standard adoption (VHS vs. Betamax)',
      'Meeting location decisions',
      'International policy coordination',
      'Platform choice in digital markets'
    ],
    learningObjectives: [
      'Understand coordination games and multiple equilibria',
      'Learn about mixed strategy equilibria',
      'Recognize the value of communication and commitment',
      'Appreciate how timing affects outcomes'
    ],
    prerequisites: ['nash-equilibrium', 'pure-strategies'],
    nextSteps: ['mixed-strategies', 'sequential-games', 'mechanism-design']
  },

  [GameType.CHICKEN_GAME]: {
    gameType: GameType.CHICKEN_GAME,
    overview: 'A game of brinkmanship where backing down is costly but collision is catastrophic for both players.',
    keyCharacteristics: [
      'High stakes with catastrophic mutual defection',
      'Asymmetric equilibria favor the more committed player',
      'Credible threats and reputation are crucial',
      'Risk dominance vs. payoff dominance trade-offs'
    ],
    strategicInsights: [
      'Commitment to aggressive strategy can be advantageous',
      'Reputation for toughness affects opponent behavior',
      'Communication can help avoid catastrophic outcomes',
      'Risk attitudes significantly influence strategy choice'
    ],
    commonMistakes: [
      'Underestimating the cost of mutual aggression',
      'Ignoring the role of credibility in threats',
      'Not considering risk preferences',
      'Overlooking the value of appearing irrational'
    ],
    realWorldExamples: [
      'Nuclear deterrence and MAD doctrine',
      'Trade wars and tariff escalation',
      'Corporate pricing wars',
      'Political standoffs and government shutdowns'
    ],
    learningObjectives: [
      'Understand brinkmanship and credible threats',
      'Learn about risk dominance and strategic commitment',
      'Recognize escalation dynamics in conflicts',
      'Appreciate the role of reputation and irrationality'
    ],
    prerequisites: ['game-theory-basics', 'nash-equilibrium'],
    nextSteps: ['repeated-games', 'reputation-models', 'mechanism-design']
  },

  [GameType.STAG_HUNT]: {
    gameType: GameType.STAG_HUNT,
    overview: 'A coordination game emphasizing trust and cooperation, where mutual cooperation yields the highest payoffs but requires coordination.',
    keyCharacteristics: [
      'Two pure strategy Nash equilibria',
      'Payoff-dominant vs. risk-dominant equilibria',
      'Trust and coordination are essential for optimal outcome',
      'Safe strategy vs. efficient strategy trade-off'
    ],
    strategicInsights: [
      'Cooperation is mutually beneficial but risky',
      'Risk-dominant equilibrium may not be payoff-optimal',
      'Communication and trust-building are valuable',
      'Cultural and institutional factors affect cooperation'
    ],
    commonMistakes: [
      'Assuming players always choose payoff-dominant equilibrium',
      'Ignoring risk considerations and trust requirements',
      'Not considering learning and adaptation',
      'Overlooking the role of social institutions'
    ],
    realWorldExamples: [
      'Team projects and collaborative work',
      'International environmental agreements',
      'Economic development and industrialization',
      'Research and development partnerships'
    ],
    learningObjectives: [
      'Understand payoff vs. risk dominance',
      'Learn about trust and cooperation in strategic settings',
      'Recognize the role of institutions in promoting cooperation',
      'Appreciate cultural factors in game outcomes'
    ],
    prerequisites: ['coordination-games', 'nash-equilibrium'],
    nextSteps: ['evolutionary-games', 'cultural-evolution', 'institutional-design']
  },

  [GameType.HAWK_DOVE]: {
    gameType: GameType.HAWK_DOVE,
    overview: 'An evolutionary game modeling aggressive vs. peaceful strategies in contests over resources.',
    keyCharacteristics: [
      'Evolutionary stable strategy (ESS) concept',
      'Population dynamics and frequency-dependent selection',
      'Cost-benefit analysis of aggressive behavior',
      'Mixed population equilibria'
    ],
    strategicInsights: [
      'Neither pure aggressive nor pure peaceful populations are stable',
      'Stable population mix depends on costs and benefits',
      'Individual behavior emerges from population-level forces',
      'Resource value affects optimal aggression levels'
    ],
    commonMistakes: [
      'Thinking in terms of individual optimization only',
      'Ignoring population-level dynamics',
      'Not considering evolutionary time scales',
      'Overlooking cost-benefit trade-offs'
    ],
    realWorldExamples: [
      'Animal contest behavior and territoriality',
      'Business competition strategies',
      'International relations and conflict',
      'Sports and competitive environments'
    ],
    learningObjectives: [
      'Understand evolutionary stable strategies',
      'Learn about population dynamics in games',
      'Recognize frequency-dependent selection',
      'Appreciate biological foundations of game theory'
    ],
    prerequisites: ['evolutionary-game-theory', 'population-dynamics'],
    nextSteps: ['replicator-dynamics', 'group-selection', 'cultural-evolution']
  },

  [GameType.MATCHING_PENNIES]: {
    gameType: GameType.MATCHING_PENNIES,
    overview: 'A zero-sum game where one player wins exactly what the other loses, requiring mixed strategy equilibrium.',
    keyCharacteristics: [
      'Pure zero-sum competition',
      'No pure strategy Nash equilibrium',
      'Unique mixed strategy equilibrium',
      'Minimax theorem application'
    ],
    strategicInsights: [
      'Optimal strategy involves 50-50 randomization',
      'Predictability is disadvantageous',
      'Expected payoff is zero for both players',
      'Information has no value in symmetric zero-sum games'
    ],
    commonMistakes: [
      'Trying to find patterns in random play',
      'Assuming pure strategies can be optimal',
      'Not understanding the minimax principle',
      'Overcomplicating the randomization strategy'
    ],
    realWorldExamples: [
      'Sports strategy (penalty kicks, play-calling)',
      'Military tactics and deception',
      'Financial trading and market timing',
      'Poker and bluffing strategies'
    ],
    learningObjectives: [
      'Master mixed strategy equilibrium concepts',
      'Understand zero-sum game theory',
      'Learn about randomization and unpredictability',
      'Apply minimax theorem principles'
    ],
    prerequisites: ['mixed-strategies', 'zero-sum-games'],
    nextSteps: ['extensive-form-games', 'information-economics', 'auction-theory']
  },

  [GameType.PUBLIC_GOODS]: {
    gameType: GameType.PUBLIC_GOODS,
    overview: 'A multi-player game examining free-riding problems in providing public goods.',
    keyCharacteristics: [
      'N-player extension of cooperation dilemmas',
      'Free-riding incentives and public good provision',
      'Continuous strategy spaces',
      'Efficiency vs. individual incentives'
    ],
    strategicInsights: [
      'Individual incentives lead to under-provision',
      'Marginal per capita return determines contribution levels',
      'Voluntary contribution mechanisms often fail',
      'Institutions and mechanisms can improve outcomes'
    ],
    commonMistakes: [
      'Ignoring free-riding incentives',
      'Not considering marginal costs and benefits',
      'Overlooking institutional solutions',
      'Assuming voluntary provision is efficient'
    ],
    realWorldExamples: [
      'Environmental protection and climate change',
      'Public broadcasting and media',
      'Open source software development',
      'National defense and security'
    ],
    learningObjectives: [
      'Understand free-riding and public goods problems',
      'Learn about mechanism design solutions',
      'Recognize the role of institutions',
      'Appreciate multi-player game dynamics'
    ],
    prerequisites: ['n-player-games', 'social-dilemmas'],
    nextSteps: ['mechanism-design', 'public-economics', 'collective-action']
  },

  [GameType.COORDINATION]: {
    gameType: GameType.COORDINATION,
    overview: 'A pure coordination game where players benefit from matching strategies.',
    keyCharacteristics: [
      'Multiple Pareto-efficient equilibria',
      'No conflict of interest between players',
      'Coordination problem without distributional issues',
      'Salience and focal points matter'
    ],
    strategicInsights: [
      'Communication can solve coordination problems',
      'Focal points help select among equilibria',
      'History and precedent influence coordination',
      'All players prefer successful coordination'
    ],
    commonMistakes: [
      'Underestimating coordination difficulties',
      'Ignoring the role of focal points',
      'Not considering communication possibilities',
      'Overlooking historical and cultural factors'
    ],
    realWorldExamples: [
      'Language and communication conventions',
      'Traffic rules and driving sides',
      'Currency adoption and monetary systems',
      'Technical standards and protocols'
    ],
    learningObjectives: [
      'Understand pure coordination challenges',
      'Learn about focal points and salience',
      'Recognize the value of communication',
      'Appreciate convention formation'
    ],
    prerequisites: ['coordination-games', 'multiple-equilibria'],
    nextSteps: ['evolutionary-games', 'cultural-transmission', 'network-effects']
  },

  [GameType.CUSTOM]: {
    gameType: GameType.CUSTOM,
    overview: 'Custom games allow exploration of unique strategic situations and testing of game theory concepts.',
    keyCharacteristics: [
      'User-defined payoff structures',
      'Flexible strategy spaces',
      'Experimental game design',
      'Theory testing and validation'
    ],
    strategicInsights: [
      'Game structure determines strategic incentives',
      'Payoff design affects equilibrium outcomes',
      'Custom games can model real-world situations',
      'Experimentation reveals theoretical insights'
    ],
    commonMistakes: [
      'Creating games without clear objectives',
      'Ignoring incentive compatibility',
      'Not considering equilibrium analysis',
      'Overlooking implementation challenges'
    ],
    realWorldExamples: [
      'Organizational design and incentive systems',
      'Market design and mechanism creation',
      'Policy intervention modeling',
      'Experimental economics research'
    ],
    learningObjectives: [
      'Design games for specific purposes',
      'Understand relationship between structure and outcomes',
      'Learn experimental methodology',
      'Apply theory to practical problems'
    ],
    prerequisites: ['game-theory-fundamentals', 'equilibrium-analysis'],
    nextSteps: ['mechanism-design', 'experimental-economics', 'applied-game-theory']
  }
}

// Tutorial definitions
export const TUTORIALS: Record<string, Tutorial> = {
  GETTING_STARTED: {
    id: 'getting-started',
    title: 'Getting Started with Game Theory',
    description: 'A comprehensive introduction to game theory concepts and the simulation platform',
    difficulty: 'beginner',
    estimatedTime: 15,
    prerequisites: [],
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Game Theory Studio',
        description: 'Introduction to the platform and its capabilities',
        content: 'Welcome to Monte Carlo Game Theory Studio! This platform helps you explore strategic interactions through simulation and analysis. You\'ll learn fundamental concepts like Nash equilibrium, dominant strategies, and more through interactive examples.',
        tips: ['Take your time to understand each concept', 'Try different scenarios to see how outcomes change']
      },
      {
        id: 'select-game',
        title: 'Selecting a Game',
        description: 'Learn how to choose and configure a game scenario',
        targetElement: 'game-selector',
        action: 'click',
        content: 'Start by selecting a game from our library. Each game represents a different strategic situation with unique characteristics and learning opportunities.',
        tips: ['Begin with Prisoner\'s Dilemma for a classic introduction', 'Read the game descriptions to understand the scenario']
      },
      {
        id: 'understand-payoffs',
        title: 'Understanding Payoffs',
        description: 'Learn how to read and interpret payoff matrices',
        targetElement: 'payoff-matrix',
        content: 'The payoff matrix shows what each player receives based on the combination of strategies chosen. Higher numbers are better for that player.',
        tips: ['Each cell shows (Player 1 payoff, Player 2 payoff)', 'Look for patterns in the payoffs to understand incentives']
      },
      {
        id: 'run-simulation',
        title: 'Running Your First Simulation',
        description: 'Execute a Monte Carlo simulation to see how strategies perform',
        targetElement: 'simulation-controls',
        action: 'click',
        content: 'Monte Carlo simulation runs thousands of iterations to show how different strategies perform over time. This reveals patterns and equilibrium behavior.',
        tips: ['Start with 10,000 iterations for reliable results', 'Watch how strategies converge or diverge over time']
      },
      {
        id: 'analyze-results',
        title: 'Analyzing Results',
        description: 'Understand simulation output and strategic insights',
        targetElement: 'results-visualization',
        content: 'The results show strategy frequencies, payoff distributions, and equilibrium analysis. Look for Nash equilibria and dominant strategies.',
        tips: ['Compare expected vs. actual outcomes', 'Notice how individual rationality affects collective results']
      }
    ],
    completionCriteria: [
      'Selected and configured a game',
      'Understood payoff matrix interpretation',
      'Successfully ran a simulation',
      'Analyzed basic results and insights'
    ]
  },

  NASH_EQUILIBRIUM_DEEP_DIVE: {
    id: 'nash-equilibrium-deep-dive',
    title: 'Understanding Nash Equilibrium',
    description: 'Deep dive into Nash equilibrium concepts with multiple examples',
    difficulty: 'intermediate',
    estimatedTime: 25,
    prerequisites: ['getting-started'],
    steps: [
      {
        id: 'concept-intro',
        title: 'Nash Equilibrium Concept',
        description: 'Understand the fundamental definition and importance',
        content: 'A Nash equilibrium is a strategy profile where no player wants to unilaterally deviate. It represents a stable outcome where everyone is doing their best given what others are doing.',
        tips: ['Think of it as a "stable" situation', 'Not necessarily the best outcome for everyone']
      },
      {
        id: 'prisoners-nash',
        title: 'Nash Equilibrium in Prisoner\'s Dilemma',
        description: 'Identify and understand the Nash equilibrium',
        targetElement: 'game-selector',
        content: 'In Prisoner\'s Dilemma, (Defect, Defect) is the Nash equilibrium. Neither player wants to switch to Cooperate given that the other is playing Defect.',
        tips: ['Check: if opponent defects, is cooperating better?', 'The Nash equilibrium may not be socially optimal']
      },
      {
        id: 'battle-nash',
        title: 'Multiple Nash Equilibria',
        description: 'Explore games with multiple equilibria',
        targetElement: 'game-selector',
        content: 'Battle of the Sexes has two pure strategy Nash equilibria and one mixed strategy equilibrium. This creates coordination challenges.',
        tips: ['Multiple equilibria mean prediction is harder', 'Communication can help select equilibria']
      },
      {
        id: 'mixed-strategies',
        title: 'Mixed Strategy Equilibria',
        description: 'Understand when and why players randomize',
        content: 'When no pure strategy equilibrium exists, players may use mixed strategies - randomizing between actions to keep opponents uncertain.',
        tips: ['Players must be indifferent between pure strategies', 'Mixing makes the player unpredictable']
      }
    ],
    completionCriteria: [
      'Identified Nash equilibria in different games',
      'Distinguished between pure and mixed strategy equilibria',
      'Understood why players might deviate from equilibrium',
      'Recognized coordination problems with multiple equilibria'
    ]
  },

  STRATEGY_ANALYSIS: {
    id: 'strategy-analysis',
    title: 'Advanced Strategy Analysis',
    description: 'Learn to analyze dominant strategies, mixed strategies, and evolutionary dynamics',
    difficulty: 'advanced',
    estimatedTime: 30,
    prerequisites: ['nash-equilibrium-deep-dive'],
    steps: [
      {
        id: 'dominance-analysis',
        title: 'Strategic Dominance',
        description: 'Identify and eliminate dominated strategies',
        targetElement: 'strategic-analysis',
        content: 'A strategy is dominated if another strategy always performs better. Rational players never choose dominated strategies.',
        tips: ['Compare each strategy against all others', 'Eliminate dominated strategies to simplify games']
      },
      {
        id: 'best-response',
        title: 'Best Response Analysis',
        description: 'Calculate optimal responses to opponent strategies',
        targetElement: 'best-response-chart',
        content: 'For each opponent strategy, find your best response. Nash equilibria occur where strategies are mutual best responses.',
        tips: ['Graph best responses to visualize equilibria', 'Intersections indicate Nash equilibria']
      },
      {
        id: 'evolutionary-dynamics',
        title: 'Evolutionary Stability',
        description: 'Understand how strategies evolve over time',
        targetElement: 'evolutionary-dynamics',
        content: 'Evolutionary stable strategies resist invasion by alternative strategies. They emerge from repeated interactions and learning.',
        tips: ['ESS is stricter than Nash equilibrium', 'Consider population-level dynamics']
      },
      {
        id: 'simulation-insights',
        title: 'Simulation-Based Insights',
        description: 'Use Monte Carlo simulation to verify theoretical predictions',
        content: 'Simulations can reveal convergence patterns, stability of equilibria, and robustness to perturbations.',
        tips: ['Compare simulation results to theoretical predictions', 'Look for patterns in strategy evolution']
      }
    ],
    completionCriteria: [
      'Successfully identified dominated strategies',
      'Calculated best responses and found equilibria',
      'Understood evolutionary stability concepts',
      'Used simulation to verify theoretical insights'
    ]
  }
}

export class EducationalContentManager {
  private static instance: EducationalContentManager

  static getInstance(): EducationalContentManager {
    if (!EducationalContentManager.instance) {
      EducationalContentManager.instance = new EducationalContentManager()
    }
    return EducationalContentManager.instance
  }

  getConcept(conceptId: string): EducationalConcept | null {
    return EDUCATIONAL_CONCEPTS[conceptId.toUpperCase()] || null
  }

  getGameContent(gameType: GameType): GameEducationalContent | null {
    return GAME_EDUCATIONAL_CONTENT[gameType] || null
  }

  getTutorial(tutorialId: string): Tutorial | null {
    return TUTORIALS[tutorialId.toUpperCase()] || null
  }

  getConceptsByCategory(category: string): EducationalConcept[] {
    return Object.values(EDUCATIONAL_CONCEPTS).filter(
      concept => concept.category === category
    )
  }

  getConceptsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): EducationalConcept[] {
    return Object.values(EDUCATIONAL_CONCEPTS).filter(
      concept => concept.difficulty === difficulty
    )
  }

  getAllTutorials(): Tutorial[] {
    return Object.values(TUTORIALS)
  }

  getBeginnerTutorials(): Tutorial[] {
    return Object.values(TUTORIALS).filter(
      tutorial => tutorial.difficulty === 'beginner'
    )
  }

  searchConcepts(query: string): EducationalConcept[] {
    const searchTerm = query.toLowerCase()
    return Object.values(EDUCATIONAL_CONCEPTS).filter(concept =>
      concept.title.toLowerCase().includes(searchTerm) ||
      concept.shortDescription.toLowerCase().includes(searchTerm) ||
      concept.detailedExplanation.toLowerCase().includes(searchTerm) ||
      concept.examples.some(example => example.toLowerCase().includes(searchTerm)) ||
      concept.realWorldApplications.some(app => app.toLowerCase().includes(searchTerm))
    )
  }

  getRelatedConcepts(conceptId: string): EducationalConcept[] {
    const concept = this.getConcept(conceptId)
    if (!concept) return []

    return concept.relatedConcepts
      .map(id => this.getConcept(id))
      .filter((c): c is EducationalConcept => c !== null)
  }

  getConceptsForGame(gameType: GameType): EducationalConcept[] {
    const gameContent = this.getGameContent(gameType)
    if (!gameContent) return []

    // Return concepts relevant to this game type
    const relevantConcepts: EducationalConcept[] = []
    
    // Always include basic concepts
    const basicConcepts = ['NASH_EQUILIBRIUM', 'DOMINANT_STRATEGY']
    basicConcepts.forEach(id => {
      const concept = this.getConcept(id)
      if (concept) relevantConcepts.push(concept)
    })

    // Add game-specific concepts
    switch (gameType) {
      case GameType.PRISONERS_DILEMMA:
        const paretoEfficiency = this.getConcept('PARETO_EFFICIENCY')
        if (paretoEfficiency) relevantConcepts.push(paretoEfficiency)
        break
      case GameType.MATCHING_PENNIES:
      case GameType.BATTLE_OF_SEXES:
        const mixedStrategy = this.getConcept('MIXED_STRATEGY')
        if (mixedStrategy) relevantConcepts.push(mixedStrategy)
        break
      case GameType.HAWK_DOVE:
        // Evolutionary concepts would go here
        break
    }

    // Always include simulation concept
    const simulation = this.getConcept('MONTE_CARLO_SIMULATION')
    if (simulation) relevantConcepts.push(simulation)

    return relevantConcepts
  }
} 