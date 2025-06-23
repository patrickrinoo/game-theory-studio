import { describe, it, expect, beforeEach } from 'vitest';
import { calculateNashEquilibrium, findAllNashEquilibria } from '../lib/nash-equilibrium-calculator';
import { GameType } from '../lib/game-theory-types';

describe('Nash Equilibrium Calculator', () => {
  describe('Pure Strategy Nash Equilibria', () => {
    it('should find pure Nash equilibrium in Prisoner\'s Dilemma', () => {
      const payoffMatrix = [
        [[3, 3], [0, 5]], // If Player 1 cooperates
        [[5, 0], [1, 1]]  // If Player 1 defects
      ];

      const equilibria = findAllNashEquilibria(payoffMatrix);
      
      expect(equilibria).toBeDefined();
      expect(equilibria.length).toBeGreaterThan(0);
      
      // Prisoner's Dilemma should have (Defect, Defect) as Nash equilibrium
      const defectDefect = equilibria.find(eq => 
        eq.type === 'pure' && 
        Array.isArray(eq.strategies) && 
        eq.strategies[0] === 1 && 
        eq.strategies[1] === 1
      );
      expect(defectDefect).toBeDefined();
    });

    it('should find multiple pure Nash equilibria in Battle of Sexes', () => {
      const payoffMatrix = [
        [[2, 1], [0, 0]], // If Player 1 chooses Opera
        [[0, 0], [1, 2]]  // If Player 1 chooses Football
      ];

      const equilibria = findAllNashEquilibria(payoffMatrix);
      
      expect(equilibria).toBeDefined();
      expect(equilibria.length).toBe(3); // Two pure + one mixed equilibrium
      
      const pureEquilibria = equilibria.filter(eq => eq.type === 'pure');
      expect(pureEquilibria.length).toBe(2); // (Opera, Opera) and (Football, Football)
    });

    it('should handle no pure Nash equilibria (Matching Pennies)', () => {
      const payoffMatrix = [
        [[1, -1], [-1, 1]], // If Player 1 chooses Heads
        [[-1, 1], [1, -1]]  // If Player 1 chooses Tails
      ];

      const equilibria = findAllNashEquilibria(payoffMatrix);
      const pureEquilibria = equilibria.filter(eq => eq.type === 'pure');
      
      expect(pureEquilibria.length).toBe(0); // No pure strategy equilibria
    });
  });

  describe('Mixed Strategy Nash Equilibria', () => {
    it('should find mixed Nash equilibrium in Matching Pennies', () => {
      const payoffMatrix = [
        [[1, -1], [-1, 1]], // If Player 1 chooses Heads
        [[-1, 1], [1, -1]]  // If Player 1 chooses Tails
      ];

      const equilibria = findAllNashEquilibria(payoffMatrix);
      const mixedEquilibria = equilibria.filter(eq => eq.type === 'mixed');
      
      expect(mixedEquilibria.length).toBeGreaterThan(0);
      
      // In Matching Pennies, mixed equilibrium should be (0.5, 0.5) for both players
      const mixedEq = mixedEquilibria[0];
      expect(mixedEq.strategies).toBeDefined();
      if (Array.isArray(mixedEq.strategies[0])) {
        const strategies = mixedEq.strategies as number[][];
        expect(strategies[0][0]).toBeCloseTo(0.5, 2);
        expect(strategies[0][1]).toBeCloseTo(0.5, 2);
        expect(strategies[1][0]).toBeCloseTo(0.5, 2);
        expect(strategies[1][1]).toBeCloseTo(0.5, 2);
      }
    });

    it('should find mixed Nash equilibrium in Battle of Sexes', () => {
      const payoffMatrix = [
        [[2, 1], [0, 0]], // If Player 1 chooses Opera
        [[0, 0], [1, 2]]  // If Player 1 chooses Football
      ];

      const equilibria = findAllNashEquilibria(payoffMatrix);
      const mixedEquilibria = equilibria.filter(eq => eq.type === 'mixed');
      
      expect(mixedEquilibria.length).toBeGreaterThan(0);
      
      // Mixed equilibrium in Battle of Sexes should exist with specific probabilities
      const mixedEq = mixedEquilibria[0];
      expect(mixedEq.strategies).toBeDefined();
      expect(mixedEq.payoffs).toBeDefined();
      expect(mixedEq.payoffs.length).toBe(2);
    });
  });

  describe('Equilibrium Properties', () => {
    it('should correctly identify strict Nash equilibria', () => {
      const payoffMatrix = [
        [[3, 3], [0, 5]], // Prisoner's Dilemma
        [[5, 0], [1, 1]]
      ];

      const equilibria = findAllNashEquilibria(payoffMatrix);
      const strictEquilibria = equilibria.filter(eq => eq.isStrict);
      
      expect(strictEquilibria.length).toBeGreaterThan(0);
    });

    it('should calculate stability scores correctly', () => {
      const payoffMatrix = [
        [[3, 3], [0, 5]], // Prisoner's Dilemma
        [[5, 0], [1, 1]]
      ];

      const equilibria = findAllNashEquilibria(payoffMatrix);
      
      for (const eq of equilibria) {
        expect(eq.stability).toBeGreaterThanOrEqual(0);
        expect(eq.stability).toBeLessThanOrEqual(1);
      }
    });

    it('should calculate expected payoffs correctly', () => {
      const payoffMatrix = [
        [[3, 3], [0, 5]], // Prisoner's Dilemma
        [[5, 0], [1, 1]]
      ];

      const equilibrium = calculateNashEquilibrium(payoffMatrix, [1, 1]); // Defect, Defect
      
      expect(equilibrium).toBeDefined();
      expect(equilibrium.payoffs).toBeDefined();
      expect(equilibrium.payoffs[0]).toBe(1); // Expected payoff for Player 1
      expect(equilibrium.payoffs[1]).toBe(1); // Expected payoff for Player 2
    });
  });

  describe('Multi-Player Games', () => {
    it('should handle 3-player games', () => {
      // Simple 3-player coordination game
      const payoffMatrix = [
        [
          [[3, 3, 3], [0, 0, 0]], // P1=A, P2=A
          [[0, 0, 0], [1, 1, 1]]  // P1=A, P2=B
        ],
        [
          [[0, 0, 0], [1, 1, 1]], // P1=B, P2=A
          [[1, 1, 1], [3, 3, 3]]  // P1=B, P2=B
        ]
      ];

      const equilibria = findAllNashEquilibria(payoffMatrix);
      
      expect(equilibria).toBeDefined();
      expect(equilibria.length).toBeGreaterThan(0);
      
      // Should find at least the coordination equilibria
      const pureEquilibria = equilibria.filter(eq => eq.type === 'pure');
      expect(pureEquilibria.length).toBeGreaterThan(0);
    });

    it('should handle asymmetric games', () => {
      // Asymmetric 2-player game
      const payoffMatrix = [
        [[4, 1], [2, 3]], // If Player 1 chooses first strategy
        [[1, 4], [3, 2]]  // If Player 1 chooses second strategy
      ];

      const equilibria = findAllNashEquilibria(payoffMatrix);
      
      expect(equilibria).toBeDefined();
      expect(equilibria.length).toBeGreaterThan(0);
      
      // Verify payoffs are calculated correctly for asymmetric game
      for (const eq of equilibria) {
        expect(eq.payoffs).toBeDefined();
        expect(eq.payoffs.length).toBe(2);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle single strategy games', () => {
      const payoffMatrix = [
        [[5, 5]] // Only one strategy for each player
      ];

      const equilibria = findAllNashEquilibria(payoffMatrix);
      
      expect(equilibria).toBeDefined();
      expect(equilibria.length).toBe(1);
      expect(equilibria[0].type).toBe('pure');
      expect(equilibria[0].strategies).toEqual([0, 0]);
    });

    it('should handle games with zero payoffs', () => {
      const payoffMatrix = [
        [[0, 0], [0, 0]],
        [[0, 0], [0, 0]]
      ];

      const equilibria = findAllNashEquilibria(payoffMatrix);
      
      expect(equilibria).toBeDefined();
      expect(equilibria.length).toBeGreaterThan(0);
      
      // All strategy combinations should be Nash equilibria
      expect(equilibria.length).toBe(4); // 2x2 = 4 pure strategy combinations
    });

    it('should handle negative payoffs', () => {
      const payoffMatrix = [
        [[-1, -1], [-3, 0]],
        [[0, -3], [-2, -2]]
      ];

      const equilibria = findAllNashEquilibria(payoffMatrix);
      
      expect(equilibria).toBeDefined();
      expect(equilibria.length).toBeGreaterThan(0);
      
      // Verify payoffs can be negative
      for (const eq of equilibria) {
        expect(eq.payoffs).toBeDefined();
        // Some payoffs might be negative, which is valid
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle large strategy spaces efficiently', () => {
      // Create a larger game (5x5 strategies)
      const size = 5;
      const payoffMatrix = Array(size).fill(null).map((_, i) =>
        Array(size).fill(null).map((_, j) => [
          Math.random() * 10,  // Random payoff for Player 1
          Math.random() * 10   // Random payoff for Player 2
        ])
      );

      const start = Date.now();
      const equilibria = findAllNashEquilibria(payoffMatrix);
      const duration = Date.now() - start;

      expect(equilibria).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should be deterministic with same inputs', () => {
      const payoffMatrix = [
        [[3, 3], [0, 5]],
        [[5, 0], [1, 1]]
      ];

      const equilibria1 = findAllNashEquilibria(payoffMatrix);
      const equilibria2 = findAllNashEquilibria(payoffMatrix);

      expect(equilibria1.length).toBe(equilibria2.length);
      
      // Compare equilibria (order might differ, so check if sets are equal)
      for (const eq1 of equilibria1) {
        const matchingEq2 = equilibria2.find(eq2 => 
          eq1.type === eq2.type && 
          JSON.stringify(eq1.strategies) === JSON.stringify(eq2.strategies)
        );
        expect(matchingEq2).toBeDefined();
      }
    });
  });

  describe('Validation Tests', () => {
    it('should validate Nash equilibrium conditions', () => {
      const payoffMatrix = [
        [[3, 3], [0, 5]],
        [[5, 0], [1, 1]]
      ];

      const equilibria = findAllNashEquilibria(payoffMatrix);
      
      for (const eq of equilibria) {
        // Verify that no player wants to unilaterally deviate
        if (eq.type === 'pure' && Array.isArray(eq.strategies)) {
          const strategies = eq.strategies as number[];
          
          // Check Player 1's best response
          for (let alt = 0; alt < payoffMatrix.length; alt++) {
            const currentPayoff = payoffMatrix[strategies[0]][strategies[1]][0];
            const altPayoff = payoffMatrix[alt][strategies[1]][0];
            expect(currentPayoff).toBeGreaterThanOrEqual(altPayoff);
          }
          
          // Check Player 2's best response
          for (let alt = 0; alt < payoffMatrix[0].length; alt++) {
            const currentPayoff = payoffMatrix[strategies[0]][strategies[1]][1];
            const altPayoff = payoffMatrix[strategies[0]][alt][1];
            expect(currentPayoff).toBeGreaterThanOrEqual(altPayoff);
          }
        }
      }
    });

    it('should handle invalid payoff matrices gracefully', () => {
      // Empty matrix
      expect(() => findAllNashEquilibria([])).toThrow();
      
      // Inconsistent dimensions
      const invalidMatrix = [
        [[1, 1], [2, 2]],
        [[3, 3]] // Missing second strategy
      ];
      expect(() => findAllNashEquilibria(invalidMatrix)).toThrow();
    });
  });
}); 