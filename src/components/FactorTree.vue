<script setup lang="ts">
import { computed } from "vue"
import { hierarchy, tree } from "d3-hierarchy"

type TreeNode = { name: string; children?: TreeNode[] }

const props = defineProps<{
  value: number
}>()

function smallestFactor(n: number) {
  if (n % 2 === 0) return 2
  let f = 3
  while (f * f <= n) {
    if (n % f === 0) return f
    f += 2
  }
  return n
}

function buildTree(n: number): TreeNode {
  const num = Math.abs(n)
  if (num <= 1) return { name: String(n) }
  const factor = smallestFactor(num)
  if (factor === num) {
    return {
      name: String(num),
      children: [{ name: String(num) }, { name: "1" }],
    }
  }
  const other = num / factor
  return {
    name: String(num),
    children: [{ name: String(factor) }, buildTree(other)],
  }
}

const layout = computed(() => {
  const root = hierarchy<TreeNode>(buildTree(props.value))
  const treeLayout = tree<TreeNode>().nodeSize([50, 70])
  treeLayout(root)
  const nodes = root.descendants()
  const links = root.links()
  const minX = Math.min(...nodes.map((n) => n.x))
  const maxX = Math.max(...nodes.map((n) => n.x))
  const minY = Math.min(...nodes.map((n) => n.y))
  const maxY = Math.max(...nodes.map((n) => n.y))
  const padding = 40
  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2
  return {
    nodes,
    links,
    viewBox: `${minX - padding} ${minY - padding} ${width} ${height}`,
  }
})
</script>

<template>
  <svg class="factor-tree" :viewBox="layout.viewBox" role="img" aria-label="Factor tree diagram">
    <g>
      <path
        v-for="(link, idx) in layout.links"
        :key="idx"
        :d="`M ${link.source.x} ${link.source.y} L ${link.target.x} ${link.target.y}`"
        class="tree-link"
      />
      <g v-for="(node, idx) in layout.nodes" :key="idx" :transform="`translate(${node.x}, ${node.y})`">
        <circle r="16" class="tree-node" />
        <text class="tree-label" dy="5" text-anchor="middle">{{ node.data.name }}</text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.factor-tree {
  width: 100%;
  height: auto;
}

.tree-link {
  stroke: #b7beb0;
  stroke-width: 1.2;
  fill: none;
}

.tree-node {
  fill: #ffffff;
  stroke: #2f6b4f;
  stroke-width: 1.5;
}

.tree-label {
  font-size: 10px;
  fill: #1e1f1a;
  font-weight: 600;
}
</style>
