import { Node } from 'reactflow';

interface Position {
  x: number;
  y: number;
}

export class LayoutManager {
  private static readonly SPACING = {
    VERTICAL: 300,
    HORIZONTAL: 400,
    FILE_NODE: 320,
    MIN_DISTANCE: 100,
    GRID: 50
  };

  private static isPositionOccupied(position: Position, nodes: Node[]): boolean {
    return nodes.some(node => {
      const distance = {
        x: Math.abs(node.position.x - position.x),
        y: Math.abs(node.position.y - position.y)
      };
      return distance.x < this.SPACING.MIN_DISTANCE && distance.y < this.SPACING.MIN_DISTANCE;
    });
  }

  private static snapToGrid(position: Position): Position {
    return {
      x: Math.round(position.x / this.SPACING.GRID) * this.SPACING.GRID,
      y: Math.round(position.y / this.SPACING.GRID) * this.SPACING.GRID
    };
  }

  static getNewNodePosition(nodes: Node[], parentNode?: Node, edges?: any[]): Position {
    const basePosition = parentNode 
      ? {
          x: parentNode.position.x + this.SPACING.HORIZONTAL,
          y: parentNode.position.y
        }
      : {
          x: 0,
          y: 0
        };

    if (!nodes.length) {
      return this.snapToGrid(basePosition);
    }

    let position = this.snapToGrid(basePosition);
    const maxAttempts = 100;
    let attempts = 0;
    let radius = 1;
    let angle = 0;

    while (this.isPositionOccupied(position, nodes) && attempts < maxAttempts) {
      angle += Math.PI / 4;
      if (angle >= Math.PI * 2) {
        angle = 0;
        radius++;
      }

      position = this.snapToGrid({
        x: basePosition.x + Math.cos(angle) * (radius * this.SPACING.HORIZONTAL),
        y: basePosition.y + Math.sin(angle) * (radius * this.SPACING.VERTICAL)
      });
      attempts++;
    }

    return position;
  }
}