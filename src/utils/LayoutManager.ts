import { Node } from 'reactflow';

interface Position {
  x: number;
  y: number;
}

export class LayoutManager {
  private static readonly VERTICAL_SPACING = 300;
  private static readonly HORIZONTAL_SPACING = 400;
  private static readonly FILE_NODE_SPACING = 320;
  private static readonly MIN_DISTANCE = 100;
  private static readonly GRID_SIZE = 50;

  private static isPositionOccupied(position: Position, nodes: Node[]): boolean {
    return nodes.some(node => {
      const dx = Math.abs(node.position.x - position.x);
      const dy = Math.abs(node.position.y - position.y);
      return dx < this.MIN_DISTANCE && dy < this.MIN_DISTANCE;
    });
  }

  private static snapToGrid(position: Position): Position {
    return {
      x: Math.round(position.x / this.GRID_SIZE) * this.GRID_SIZE,
      y: Math.round(position.y / this.GRID_SIZE) * this.GRID_SIZE
    };
  }

  private static findNextAvailablePosition(basePosition: Position, nodes: Node[]): Position {
    const maxAttempts = 100; // 防止无限循环
    let attempts = 0;
    let position = this.snapToGrid({ ...basePosition });
    let radius = 1;
    let angle = 0;

    while (this.isPositionOccupied(position, nodes) && attempts < maxAttempts) {
      // 使用螺旋形状搜索可用位置
      angle += Math.PI / 4;
      if (angle >= Math.PI * 2) {
        angle = 0;
        radius++;
      }

      position = this.snapToGrid({
        x: basePosition.x + Math.cos(angle) * (radius * this.HORIZONTAL_SPACING),
        y: basePosition.y + Math.sin(angle) * (radius * this.VERTICAL_SPACING)
      });

      attempts++;
    }

    // 如果找不到合适的位置，返回一个保底位置
    if (attempts >= maxAttempts) {
      return this.snapToGrid({
        x: basePosition.x + (nodes.length * this.HORIZONTAL_SPACING),
        y: basePosition.y
      });
    }

    return position;
  }

  static getNewNodePosition(nodes: Node[], parentNode?: Node): Position {
    if (nodes.length === 0) {
      return this.snapToGrid({ x: 100, y: 100 });
    }

    if (!parentNode) {
      // 找到所有节点的边界
      const bounds = nodes.reduce((acc, node) => ({
        minX: Math.min(acc.minX, node.position.x),
        maxX: Math.max(acc.maxX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxY: Math.max(acc.maxY, node.position.y)
      }), {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity
      });

      // 在现有节点的右侧或下方寻找位置
      const basePosition = {
        x: bounds.maxX + this.HORIZONTAL_SPACING,
        y: bounds.minY
      };

      return this.findNextAvailablePosition(basePosition, nodes);
    }

    // 对于子节点，优先尝试在父节点下方
    const basePosition = {
      x: parentNode.position.x,
      y: parentNode.position.y + this.VERTICAL_SPACING
    };

    return this.findNextAvailablePosition(basePosition, nodes);
  }

  static getFileNodesPositions(nodes: Node[], fileCount: number): Position[] {
    const positions: Position[] = [];
    const basePosition = this.getNewNodePosition(nodes);

    for (let i = 0; i < fileCount; i++) {
      const position = this.findNextAvailablePosition({
        x: basePosition.x + (i * this.FILE_NODE_SPACING),
        y: basePosition.y
      }, [...nodes, ...positions.map(pos => ({ position: pos } as Node))]);

      positions.push(position);
    }

    return positions;
  }

  static getChatNodePositionForFiles(nodes: Node[], fileNodes: Node[]): Position {
    if (fileNodes.length === 0) {
      return this.getNewNodePosition(nodes);
    }

    // 计算文件节点的中心点
    const centerX = fileNodes.reduce((sum, node) => sum + node.position.x, 0) / fileNodes.length;
    const maxY = Math.max(...fileNodes.map(node => node.position.y));

    const basePosition = {
      x: centerX,
      y: maxY + this.VERTICAL_SPACING
    };

    return this.findNextAvailablePosition(basePosition, nodes);
  }
}