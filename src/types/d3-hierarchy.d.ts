declare module "d3-hierarchy" {
  export interface HierarchyNode<Datum> {
    data: Datum
    x: number
    y: number
    descendants(): HierarchyNode<Datum>[]
    links(): HierarchyLink<Datum>[]
  }

  export interface HierarchyLink<Datum> {
    source: HierarchyNode<Datum>
    target: HierarchyNode<Datum>
  }

  export interface TreeLayout<Datum> {
    nodeSize(size: [number, number]): TreeLayout<Datum>
    (root: HierarchyNode<Datum>): HierarchyNode<Datum>
  }

  export function hierarchy<Datum>(data: Datum): HierarchyNode<Datum>
  export function tree<Datum>(): TreeLayout<Datum>
}
