<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { api } from "@/lib/api"

type GradeKey =
  | "pp1"
  | "pp2"
  | "grade1"
  | "grade2"
  | "grade3"
  | "grade4"
  | "grade5"
  | "grade6"
  | "grade7"
  | "grade8"
  | "grade9"

type LayoutMode = "student" | "teacher" | "intervention" | "assessment"
type PracticeStyle = "fluency" | "mixed" | "challenge"
type ProblemKind = "fact" | "missing" | "array" | "word" | "twoDigit" | "decimal" | "integer" | "algebra"

type GradeProfile = {
  key: GradeKey
  label: string
  stage: string
  factors: [number, number]
  tables: number[]
  dailyTarget: string
  learnerGoal: string
  teacherFocus: string[]
  progression: string[]
  manipulatives: string[]
  problemKinds: ProblemKind[]
}

type PracticeProblem = {
  id: number
  kind: ProblemKind
  prompt: string
  answer: string
  hint: string
  working: string
  marks: number
}

const gradeProfiles: GradeProfile[] = [
  {
    key: "pp1",
    label: "PP1",
    stage: "Early numeracy",
    factors: [1, 5],
    tables: [1, 2, 3, 4, 5],
    dailyTarget: "Count equal groups using objects and pictures.",
    learnerGoal: "I can count groups with the same number of objects.",
    teacherFocus: ["Use counters before symbols", "Say the groups aloud", "Record repeated addition"],
    progression: ["Equal groups", "Counting all", "Skip counting", "Number sentence"],
    manipulatives: ["Bottle tops", "Sticks", "Beans", "Ten frames"],
    problemKinds: ["array", "fact", "word"],
  },
  {
    key: "pp2",
    label: "PP2",
    stage: "Equal groups and arrays",
    factors: [1, 6],
    tables: [1, 2, 3, 4, 5, 6],
    dailyTarget: "Build arrays and connect them to repeated addition.",
    learnerGoal: "I can make rows and columns and count the total.",
    teacherFocus: ["Draw arrays", "Compare rows and columns", "Introduce the multiplication sign gently"],
    progression: ["Groups", "Arrays", "Repeated addition", "Multiplication sentence"],
    manipulatives: ["Counters", "Grid paper", "Number cards", "Cups"],
    problemKinds: ["array", "fact", "missing", "word"],
  },
  {
    key: "grade1",
    label: "Grade 1",
    stage: "Skip counting",
    factors: [1, 10],
    tables: [1, 2, 5, 10],
    dailyTarget: "Skip count by 2s, 5s, and 10s and describe equal groups.",
    learnerGoal: "I can skip count to find totals faster.",
    teacherFocus: ["Start with 2, 5, and 10", "Use number lines", "Connect counting patterns to totals"],
    progression: ["Skip count", "Equal groups", "Repeated addition", "Facts to 10"],
    manipulatives: ["Number lines", "Hundred chart", "Paired objects", "Bundled sticks"],
    problemKinds: ["fact", "array", "missing", "word"],
  },
  {
    key: "grade2",
    label: "Grade 2",
    stage: "Core facts",
    factors: [1, 10],
    tables: [2, 3, 4, 5, 10],
    dailyTarget: "Recall core multiplication facts and explain them with arrays.",
    learnerGoal: "I can use facts I know to solve related facts.",
    teacherFocus: ["Practice 2, 3, 4, 5, and 10", "Use commutative pairs", "Bridge from addition to multiplication"],
    progression: ["Known facts", "Turn-around facts", "Missing factor", "Word problems"],
    manipulatives: ["Array cards", "Grid paper", "Fact triangles", "Counters"],
    problemKinds: ["fact", "missing", "array", "word"],
  },
  {
    key: "grade3",
    label: "Grade 3",
    stage: "Fluency to 10 x 10",
    factors: [1, 10],
    tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    dailyTarget: "Build fast and accurate recall for facts up to 10 x 10.",
    learnerGoal: "I can choose a strategy when I do not know a fact yet.",
    teacherFocus: ["Use distributive thinking", "Practice hard facts deliberately", "Check with inverse division"],
    progression: ["Recall", "Missing factors", "Area arrays", "Single-step stories"],
    manipulatives: ["Area grids", "Fact cards", "Multiplication chart", "Counters"],
    problemKinds: ["fact", "missing", "array", "word"],
  },
  {
    key: "grade4",
    label: "Grade 4",
    stage: "Facts to 12 and one-digit products",
    factors: [1, 12],
    tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    dailyTarget: "Use facts to solve one-digit by two-digit multiplication.",
    learnerGoal: "I can break numbers apart and multiply each part.",
    teacherFocus: ["Use place value partitioning", "Write clear working", "Estimate before multiplying"],
    progression: ["Facts to 12", "Expanded form", "Area model", "Column method"],
    manipulatives: ["Base-ten blocks", "Grid paper", "Place value chart", "Area cards"],
    problemKinds: ["fact", "missing", "twoDigit", "word"],
  },
  {
    key: "grade5",
    label: "Grade 5",
    stage: "Multi-digit multiplication",
    factors: [2, 12],
    tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    dailyTarget: "Multiply two-digit numbers using area and standard methods.",
    learnerGoal: "I can show partial products and combine them correctly.",
    teacherFocus: ["Compare strategies", "Check place value alignment", "Use estimation to catch errors"],
    progression: ["Partial products", "Area model", "Column method", "Word problems"],
    manipulatives: ["Area grids", "Place value disks", "Squared paper", "Number cards"],
    problemKinds: ["twoDigit", "fact", "missing", "word"],
  },
  {
    key: "grade6",
    label: "Grade 6",
    stage: "Decimals and scaling",
    factors: [2, 12],
    tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    dailyTarget: "Multiply whole numbers and decimals in measurement contexts.",
    learnerGoal: "I can estimate decimal products and place the decimal point.",
    teacherFocus: ["Estimate first", "Track decimal places", "Use money and measurement contexts"],
    progression: ["Whole-number fluency", "Tenths", "Hundredths", "Scaling stories"],
    manipulatives: ["Decimal grids", "Place value chart", "Money models", "Measuring tape"],
    problemKinds: ["decimal", "twoDigit", "fact", "word"],
  },
  {
    key: "grade7",
    label: "Grade 7",
    stage: "Integers and proportional reasoning",
    factors: [-12, 12],
    tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    dailyTarget: "Multiply integers and use products in ratio and rate questions.",
    learnerGoal: "I can explain the sign of a product and use multiplication in rates.",
    teacherFocus: ["Separate sign reasoning from magnitude", "Use number-line contexts", "Include rates and ratios"],
    progression: ["Integer facts", "Sign rules", "Rates", "Multi-step contexts"],
    manipulatives: ["Number lines", "Counters for positives and negatives", "Ratio tables", "Grid paper"],
    problemKinds: ["integer", "twoDigit", "missing", "word"],
  },
  {
    key: "grade8",
    label: "Grade 8",
    stage: "Algebraic products",
    factors: [-12, 12],
    tables: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    dailyTarget: "Apply multiplication to algebraic expressions and proportional models.",
    learnerGoal: "I can multiply coefficients and keep variables organised.",
    teacherFocus: ["Use distributive property", "Link numeric products to algebra", "Simplify step by step"],
    progression: ["Integer products", "Distributive property", "Algebraic terms", "Context problems"],
    manipulatives: ["Algebra tiles", "Ratio tables", "Graph paper", "Expression cards"],
    problemKinds: ["algebra", "integer", "twoDigit", "word"],
  },
  {
    key: "grade9",
    label: "Grade 9",
    stage: "Advanced fluency and modelling",
    factors: [-15, 15],
    tables: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    dailyTarget: "Use multiplication accurately inside algebra, geometry, and data contexts.",
    learnerGoal: "I can select an efficient multiplication strategy for complex tasks.",
    teacherFocus: ["Mix mental, written, and algebraic products", "Require explanation", "Use estimation as a quality check"],
    progression: ["Integer fluency", "Algebraic products", "Area and scale", "Multi-step modelling"],
    manipulatives: ["Algebra tiles", "Coordinate grids", "Scale drawings", "Scientific calculator for checking"],
    problemKinds: ["algebra", "integer", "decimal", "word"],
  },
]

const defaultProfile = gradeProfiles[5] as GradeProfile

const settings = reactive({
  grade: "grade4" as GradeKey,
  layout: "student" as LayoutMode,
  style: "mixed" as PracticeStyle,
  learnerName: "",
  className: "",
  strand: "Multiplication",
  lessonTitle: "",
  problemCount: 24,
  seed: 4128,
  includeGuidance: true,
  includeGrid: true,
  includeFacts: true,
  includePractice: true,
  includeWordProblems: true,
  includeExitTicket: true,
  includeAnswerKey: false,
  includeWorkedExample: true,
  includeStrategyHints: true,
  includeRubric: true,
  showWorking: true,
  showAnswersInline: false,
  customFactorStart: 1,
  customFactorEnd: 12,
  customBaseStart: 1,
  customBaseEnd: 12,
})

const pdfLoading = ref(false)
const pdfError = ref<string | null>(null)
const route = useRoute()
const gridMode = computed(() => route.name === "multiplication-grids")

const selectedProfile = computed<GradeProfile>(() => {
  return gradeProfiles.find((profile) => profile.key === settings.grade) ?? defaultProfile
})

const title = computed(() => {
  return settings.lessonTitle.trim() || `${selectedProfile.value.label} Multiplication Practice`
})

const factorBounds = computed(() => {
  const profile = selectedProfile.value
  const profileLow = Math.max(1, Math.min(Math.abs(profile.factors[0]), Math.abs(profile.factors[1])))
  const profileHigh = Math.max(profileLow, Math.max(Math.abs(profile.factors[0]), Math.abs(profile.factors[1])))
  const low = clamp(Math.min(settings.customFactorStart, settings.customFactorEnd), 1, profileHigh)
  const high = clamp(Math.max(settings.customFactorStart, settings.customFactorEnd), low, Math.max(profileHigh, 12))
  return { low, high }
})

const baseRange = computed(() => {
  const min = clamp(Math.min(settings.customBaseStart, settings.customBaseEnd), 1, 20)
  const max = clamp(Math.max(settings.customBaseStart, settings.customBaseEnd), min, 20)
  return range(min, max)
})

const factorRange = computed(() => range(factorBounds.value.low, factorBounds.value.high))

const tableRange = computed(() => {
  const profileTables = selectedProfile.value.tables.filter((value) => value >= 1)
  const selected = baseRange.value.filter((base) => profileTables.includes(base))
  return selected.length ? selected : profileTables
})

const practiceProblems = computed(() => {
  return generateProblems(settings.problemCount, settings.seed, selectedProfile.value, settings.style)
})

const wordProblems = computed(() => practiceProblems.value.filter((problem) => problem.kind === "word").slice(0, 6))
const skillProblems = computed(() => practiceProblems.value.filter((problem) => problem.kind !== "word"))

const exitTicket = computed(() => {
  return generateProblems(4, settings.seed + 97, selectedProfile.value, "mixed")
})

const workedExample = computed(() => {
  return skillProblems.value.find((problem) => problem.kind !== "missing") ?? skillProblems.value[0] ?? practiceProblems.value[0]
})

const coverageSummary = computed(() => {
  const kinds = new Map<ProblemKind, number>()
  for (const problem of practiceProblems.value) {
    kinds.set(problem.kind, (kinds.get(problem.kind) || 0) + 1)
  }
  return Array.from(kinds.entries())
    .map(([kind, count]) => `${kindLabel(kind)}: ${count}`)
    .join(", ")
})

const teacherNotes = computed(() => {
  const profile = selectedProfile.value
  const notes = [...profile.teacherFocus]
  if (settings.layout === "intervention") {
    notes.push("Reduce speed pressure; ask learners to explain one strategy before completing the next row.")
    notes.push("Mark misconceptions by type: counting error, fact recall, place value, sign, or context setup.")
  }
  if (settings.layout === "assessment") {
    notes.push("Collect without peer correction; use the answer key for quick scoring and grouping.")
  }
  return notes
})

watch(
  () => settings.grade,
  () => {
    const profile = selectedProfile.value
    const low = Math.max(1, Math.min(Math.abs(profile.factors[0]), Math.abs(profile.factors[1])))
    const high = Math.max(low, Math.max(Math.abs(profile.factors[0]), Math.abs(profile.factors[1])))
    const positiveTables = profile.tables.filter((value) => value > 0)
    settings.customFactorStart = low
    settings.customFactorEnd = high
    settings.customBaseStart = Math.min(...positiveTables)
    settings.customBaseEnd = Math.max(...positiveTables)
  },
)

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min))
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function createRandom(seed: number) {
  let state = Math.abs(Math.trunc(seed)) || 1
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function pick<T>(items: T[], random: () => number) {
  if (!items.length) {
    throw new Error("Cannot pick from an empty list.")
  }
  return items[Math.floor(random() * items.length)] as T
}

function signedFactor(profile: GradeProfile, random: () => number) {
  const low = Math.min(profile.factors[0], profile.factors[1])
  const high = Math.max(profile.factors[0], profile.factors[1])
  let value = Math.floor(random() * (high - low + 1)) + low
  if (value === 0) value = 1
  return value
}

function positiveFactor(profile: GradeProfile, random: () => number) {
  const low = Math.max(1, Math.min(Math.abs(profile.factors[0]), Math.abs(profile.factors[1])))
  const high = Math.max(low, Math.max(Math.abs(profile.factors[0]), Math.abs(profile.factors[1])))
  return Math.floor(random() * (high - low + 1)) + low
}

function generateProblems(
  count: number,
  seed: number,
  profile: GradeProfile,
  style: PracticeStyle,
): PracticeProblem[] {
  const random = createRandom(seed + profile.key.length * 37 + style.length * 11)
  const total = clamp(count, 4, 80)
  const kinds = profile.problemKinds
  const weightedKinds: ProblemKind[] = style === "fluency"
    ? kinds.concat(["fact", "fact", "missing"])
    : style === "challenge"
      ? kinds.concat(["word", "missing", "twoDigit", "algebra"])
      : kinds.concat(["fact", "missing", "word"])

  return Array.from({ length: total }, (_, index) => {
    const kind = pick(weightedKinds, random)
    return buildProblem(index + 1, kind, profile, random, style)
  })
}

function buildProblem(
  id: number,
  kind: ProblemKind,
  profile: GradeProfile,
  random: () => number,
  style: PracticeStyle,
): PracticeProblem {
  const a = kind === "integer" || kind === "algebra" ? signedFactor(profile, random) : positiveFactor(profile, random)
  const b = kind === "integer" ? signedFactor(profile, random) : positiveFactor(profile, random)
  const product = a * b

  if (kind === "missing") {
    const missingFirst = random() > 0.5
    return {
      id,
      kind,
      prompt: missingFirst ? `___ × ${b} = ${product}` : `${a} × ___ = ${product}`,
      answer: String(missingFirst ? a : b),
      hint: "Use the related division fact or skip count by the known factor.",
      working: missingFirst ? `${product} ÷ ${b} = ${a}` : `${product} ÷ ${a} = ${b}`,
      marks: 1,
    }
  }

  if (kind === "array") {
    return {
      id,
      kind,
      prompt: `Draw an array with ${a} rows and ${b} columns. Write the multiplication sentence.`,
      answer: `${a} × ${b} = ${product}`,
      hint: "Keep the rows equal and count by one row at a time.",
      working: `${a} groups of ${b}: ${range(1, a).map((step) => step * b).join(", ")}`,
      marks: 2,
    }
  }

  if (kind === "twoDigit") {
    const tens = style === "challenge" ? 20 + Math.floor(random() * 80) : 10 + Math.floor(random() * 50)
    const multiplier = positiveFactor(profile, random)
    return {
      id,
      kind,
      prompt: `${tens} × ${multiplier} =`,
      answer: String(tens * multiplier),
      hint: `Break ${tens} into tens and ones, then multiply each part by ${multiplier}.`,
      working: `${tens} × ${multiplier} = ${Math.floor(tens / 10) * 10} × ${multiplier} + ${tens % 10} × ${multiplier} = ${tens * multiplier}`,
      marks: 2,
    }
  }

  if (kind === "decimal") {
    const decimal = (Math.floor(random() * 90) + 10) / 10
    const multiplier = positiveFactor(profile, random)
    return {
      id,
      kind,
      prompt: `${decimal.toFixed(1)} × ${multiplier} =`,
      answer: formatNumber(decimal * multiplier),
      hint: "Estimate using whole numbers, multiply, then place the decimal point.",
      working: `${Math.round(decimal * 10)} tenths × ${multiplier} = ${Math.round(decimal * 10) * multiplier} tenths = ${formatNumber(decimal * multiplier)}`,
      marks: 2,
    }
  }

  if (kind === "integer") {
    return {
      id,
      kind,
      prompt: `${a} × ${b} =`,
      answer: String(product),
      hint: "Multiply the sizes first, then decide the sign.",
      working: `${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(product)}; ${a < 0 === b < 0 ? "same signs give positive" : "different signs give negative"}`,
      marks: 1,
    }
  }

  if (kind === "algebra") {
    const coefficient = a === 1 ? 2 : a
    const multiplier = b === 1 ? 3 : b
    return {
      id,
      kind,
      prompt: `Simplify ${coefficient}x × ${multiplier}`,
      answer: `${coefficient * multiplier}x`,
      hint: "Multiply the coefficients and keep the variable factor.",
      working: `${coefficient} × ${multiplier} = ${coefficient * multiplier}, so ${coefficient}x × ${multiplier} = ${coefficient * multiplier}x`,
      marks: 2,
    }
  }

  if (kind === "word") {
    const contexts = [
      { item: "exercise books", group: "learners", verb: "has" },
      { item: "seedlings", group: "rows", verb: "has" },
      { item: "chairs", group: "tables", verb: "has" },
      { item: "bottles of water", group: "crates", verb: "has" },
    ]
    const context = pick(contexts, random)
    return {
      id,
      kind,
      prompt: `Each of ${a} ${context.group} ${context.verb} ${b} ${context.item}. How many ${context.item} are there altogether?`,
      answer: String(product),
      hint: `There are ${a} equal groups of ${b}.`,
      working: `${a} × ${b} = ${product}`,
      marks: 2,
    }
  }

  return {
    id,
    kind: "fact",
    prompt: `${a} × ${b} =`,
    answer: String(product),
    hint: "Use a known fact, skip count, or break one factor apart.",
    working: `${a} groups of ${b} make ${product}`,
    marks: 1,
  }
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "")
}

function kindLabel(kind: ProblemKind) {
  const labels: Record<ProblemKind, string> = {
    fact: "facts",
    missing: "missing factors",
    array: "arrays",
    word: "word problems",
    twoDigit: "multi-digit",
    decimal: "decimals",
    integer: "integers",
    algebra: "algebra",
  }
  return labels[kind]
}

function resetDefaults() {
  settings.grade = "grade4"
  settings.layout = "student"
  settings.style = "mixed"
  settings.learnerName = ""
  settings.className = ""
  settings.lessonTitle = ""
  settings.problemCount = 24
  settings.seed = 4128
  settings.includeGuidance = true
  settings.includeGrid = true
  settings.includeFacts = true
  settings.includePractice = true
  settings.includeWordProblems = true
  settings.includeExitTicket = true
  settings.includeAnswerKey = false
  settings.includeWorkedExample = true
  settings.includeStrategyHints = true
  settings.includeRubric = true
  settings.showWorking = true
  settings.showAnswersInline = false
  settings.customFactorStart = 1
  settings.customFactorEnd = 12
  settings.customBaseStart = 1
  settings.customBaseEnd = 12
}

function useTablesAndGridsMode() {
  settings.lessonTitle = `${selectedProfile.value.label} Multiplication Tables and Grids`
  settings.includeGuidance = false
  settings.includeGrid = true
  settings.includeFacts = true
  settings.includePractice = false
  settings.includeWordProblems = false
  settings.includeExitTicket = false
  settings.includeAnswerKey = true
  settings.includeWorkedExample = false
  settings.includeStrategyHints = false
  settings.includeRubric = false
  settings.showWorking = false
  settings.showAnswersInline = false
}

function newVersion() {
  settings.seed = Math.floor(Math.random() * 900000) + 100000
}

watch(
  () => route.name,
  (name) => {
    if (name === "multiplication-grids") {
      useTablesAndGridsMode()
    }
  },
  { immediate: true },
)

function printNow() {
  window.print()
}

async function downloadPdf() {
  pdfError.value = null
  pdfLoading.value = true
  try {
    const payload = {
      mode: "practice_pack",
      min_factor: factorBounds.value.low,
      max_factor: factorBounds.value.high,
      row_start: factorBounds.value.low,
      row_end: factorBounds.value.high,
      col_start: Math.min(...tableRange.value),
      col_end: Math.max(...tableRange.value),
      base_start: Math.min(...tableRange.value),
      base_end: Math.max(...tableRange.value),
      show_answers: settings.layout === "teacher" || settings.showAnswersInline,
      title: title.value,
      grade_label: selectedProfile.value.label,
      learner_name: settings.learnerName,
      class_name: settings.className || selectedProfile.value.label,
      stage: selectedProfile.value.stage,
      learner_goal: selectedProfile.value.learnerGoal,
      daily_target: selectedProfile.value.dailyTarget,
      output_type: settings.layout,
      practice_style: settings.style,
      problem_count: settings.problemCount,
      seed: settings.seed,
      include_guidance: settings.includeGuidance,
      include_grid: settings.includeGrid,
      include_facts: settings.includeFacts,
      include_practice: settings.includePractice,
      include_word_problems: settings.includeWordProblems,
      include_exit_ticket: settings.includeExitTicket,
      include_answer_key: settings.includeAnswerKey,
      include_worked_example: settings.includeWorkedExample,
      include_strategy_hints: settings.includeStrategyHints,
      include_rubric: settings.includeRubric,
      show_working: settings.showWorking,
      teacher_focus: teacherNotes.value,
      progression: selectedProfile.value.progression,
      materials: selectedProfile.value.manipulatives,
    }
    const blob = await api<Blob>("math/multiplication/printouts/pdf", "POST", {
      auth: true,
      body: payload,
      responseType: "blob",
    })
    const url = URL.createObjectURL(blob)
    const stamp = new Date().toISOString().slice(0, 10)
    const link = document.createElement("a")
    link.href = url
    link.download = `multiplication_pack_${selectedProfile.value.label.replace(/\s+/g, "_").toLowerCase()}_${stamp}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    pdfError.value = err?.message || "Failed to generate PDF"
  } finally {
    pdfLoading.value = false
  }
}
</script>

<template>
  <section class="multiplication-tool">
    <div class="tool-header">
      <div>
        <p class="eyebrow">Math Tool</p>
        <h1>{{ gridMode ? "Multiplication Tables & Grids" : "Multiplication Practice Builder" }}</h1>
        <p class="subtle">
          {{
            gridMode
              ? "Print class-level multiplication tables, grids, fact cards, and answer keys."
              : "Create grade-aware learner sheets, teacher guides, exit tickets, grids, and answer keys."
          }}
        </p>
      </div>
      <div class="header-actions no-print">
        <button class="ghost" type="button" @click="resetDefaults">Reset</button>
        <button class="ghost" type="button" @click="useTablesAndGridsMode">Tables & grids</button>
        <button class="ghost" type="button" @click="newVersion">New version</button>
        <button class="primary" type="button" :disabled="pdfLoading" @click="downloadPdf">
          {{ pdfLoading ? "Preparing PDF..." : "Export Designed PDF" }}
        </button>
        <button class="ghost" type="button" @click="printNow">Print full tool</button>
      </div>
    </div>

    <p v-if="pdfError" class="error no-print">{{ pdfError }}</p>

    <div class="builder-shell">
      <aside class="settings-panel no-print">
        <details open>
          <summary>Class level</summary>
          <div class="settings-body">
            <label>
              <span>Grade / class</span>
              <select v-model="settings.grade">
                <option v-for="profile in gradeProfiles" :key="profile.key" :value="profile.key">
                  {{ profile.label }} - {{ profile.stage }}
                </option>
              </select>
            </label>
            <label>
              <span>Output type</span>
              <select v-model="settings.layout">
                <option value="student">Student practice</option>
                <option value="teacher">Teacher guide</option>
                <option value="intervention">Intervention / support</option>
                <option value="assessment">Assessment</option>
              </select>
            </label>
            <label>
              <span>Practice mix</span>
              <select v-model="settings.style">
                <option value="fluency">Fluency</option>
                <option value="mixed">Mixed practice</option>
                <option value="challenge">Challenge</option>
              </select>
            </label>
          </div>
        </details>

        <details open>
          <summary>Worksheet details</summary>
          <div class="settings-body">
            <label>
              <span>Learner name</span>
              <input v-model="settings.learnerName" type="text" placeholder="Optional" />
            </label>
            <label>
              <span>Class / stream</span>
              <input v-model="settings.className" type="text" placeholder="Optional" />
            </label>
            <label>
              <span>Lesson title</span>
              <input v-model="settings.lessonTitle" type="text" placeholder="Auto-generated" />
            </label>
            <label>
              <span>Questions</span>
              <input v-model.number="settings.problemCount" type="number" min="4" max="80" />
            </label>
            <label>
              <span>Version seed</span>
              <input v-model.number="settings.seed" type="number" min="1" />
            </label>
          </div>
        </details>

        <details open>
          <summary>Printable sections</summary>
          <div class="settings-body compact">
            <label class="check-row"><input v-model="settings.includeGuidance" type="checkbox" /> Guidance</label>
            <label class="check-row"><input v-model="settings.includeGrid" type="checkbox" /> Multiplication grid</label>
            <label class="check-row"><input v-model="settings.includeFacts" type="checkbox" /> Fact practice</label>
            <label class="check-row"><input v-model="settings.includeWorkedExample" type="checkbox" /> Worked example</label>
            <label class="check-row"><input v-model="settings.includePractice" type="checkbox" /> Mixed questions</label>
            <label class="check-row"><input v-model="settings.includeWordProblems" type="checkbox" /> Word problems</label>
            <label class="check-row"><input v-model="settings.includeExitTicket" type="checkbox" /> Exit ticket</label>
            <label class="check-row"><input v-model="settings.includeAnswerKey" type="checkbox" /> Answer key</label>
            <label class="check-row"><input v-model="settings.includeStrategyHints" type="checkbox" /> Strategy lines</label>
            <label class="check-row"><input v-model="settings.includeRubric" type="checkbox" /> Success rubric</label>
            <label class="check-row"><input v-model="settings.showWorking" type="checkbox" /> Teacher working</label>
            <label class="check-row"><input v-model="settings.showAnswersInline" type="checkbox" /> Answers inline</label>
          </div>
        </details>

        <details>
          <summary>Ranges</summary>
          <div class="settings-body two-col">
            <label>
              <span>Factor start</span>
              <input v-model.number="settings.customFactorStart" type="number" min="1" max="20" />
            </label>
            <label>
              <span>Factor end</span>
              <input v-model.number="settings.customFactorEnd" type="number" min="1" max="20" />
            </label>
            <label>
              <span>Table start</span>
              <input v-model.number="settings.customBaseStart" type="number" min="1" max="20" />
            </label>
            <label>
              <span>Table end</span>
              <input v-model.number="settings.customBaseEnd" type="number" min="1" max="20" />
            </label>
          </div>
        </details>
      </aside>

      <section class="preview-area">
        <div class="summary-strip no-print">
          <div>
            <span class="summary-label">Level</span>
            <strong>{{ selectedProfile.label }}</strong>
          </div>
          <div>
            <span class="summary-label">Target</span>
            <strong>{{ selectedProfile.dailyTarget }}</strong>
          </div>
          <div>
            <span class="summary-label">Coverage</span>
            <strong>{{ coverageSummary }}</strong>
          </div>
        </div>

        <article class="sheet cover-sheet">
          <header class="sheet-title">
            <div>
              <p class="eyebrow">{{ settings.strand }}</p>
              <h2>{{ title }}</h2>
              <p>{{ selectedProfile.stage }} - {{ selectedProfile.learnerGoal }}</p>
            </div>
            <div class="sheet-meta">
              <span>Name: {{ settings.learnerName || "________________" }}</span>
              <span>Class: {{ settings.className || selectedProfile.label }}</span>
              <span>Date: ________________</span>
              <span>Version: {{ settings.seed }}</span>
            </div>
          </header>
        </article>

        <article v-if="settings.includeGuidance" class="sheet guidance-sheet">
          <header class="sheet-section-header">
            <h2>Learning Guidance</h2>
            <span>{{ selectedProfile.label }}</span>
          </header>
          <div class="guidance-grid">
            <section>
              <h3>Progression</h3>
              <ol>
                <li v-for="step in selectedProfile.progression" :key="step">{{ step }}</li>
              </ol>
            </section>
            <section>
              <h3>Teacher focus</h3>
              <ul>
                <li v-for="note in teacherNotes" :key="note">{{ note }}</li>
              </ul>
            </section>
            <section>
              <h3>Materials</h3>
              <ul>
                <li v-for="item in selectedProfile.manipulatives" :key="item">{{ item }}</li>
              </ul>
            </section>
          </div>
          <div class="strategy-band">
            <div>
              <strong>Concrete</strong>
              <span>Build equal groups or arrays.</span>
            </div>
            <div>
              <strong>Represent</strong>
              <span>Draw rows, columns, number lines, or area models.</span>
            </div>
            <div>
              <strong>Abstract</strong>
              <span>Write the multiplication sentence and check with estimation.</span>
            </div>
          </div>
          <div v-if="settings.includeRubric" class="rubric-strip">
            <span>Correct product</span>
            <span>Clear method</span>
            <span>Neat working</span>
            <span>Reasonable estimate</span>
          </div>
        </article>

        <article v-if="settings.includeGrid" class="sheet">
          <header class="sheet-section-header">
            <h2>Multiplication Grid</h2>
            <span>Factors {{ factorRange[0] }}-{{ factorRange[factorRange.length - 1] }}</span>
          </header>
          <div class="grid-scroll">
            <table class="grid-table">
              <thead>
                <tr>
                  <th>×</th>
                  <th v-for="base in tableRange" :key="`head-${base}`">{{ base }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="factor in factorRange" :key="`factor-${factor}`">
                  <th>{{ factor }}</th>
                  <td v-for="base in tableRange" :key="`cell-${factor}-${base}`">
                    <span v-if="settings.showAnswersInline || settings.layout === 'teacher'">{{ factor * base }}</span>
                    <span v-else class="blank"></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article v-if="settings.includeFacts" class="sheet">
          <header class="sheet-section-header">
            <h2>Core Fact Practice</h2>
            <span>{{ tableRange.length }} tables</span>
          </header>
          <div class="fact-columns">
            <section v-for="base in tableRange" :key="`table-${base}`" class="fact-card">
              <h3>Table of {{ base }}</h3>
              <div v-for="factor in factorRange" :key="`fact-${base}-${factor}`" class="fact-row">
                <span>{{ base }} × {{ factor }} =</span>
                <strong v-if="settings.showAnswersInline || settings.layout === 'teacher'">{{ base * factor }}</strong>
                <span v-else class="line"></span>
              </div>
            </section>
          </div>
        </article>

        <article v-if="settings.includeWorkedExample && workedExample" class="sheet worked-example">
          <header class="sheet-section-header">
            <h2>Worked Example</h2>
            <span>Model the expected working</span>
          </header>
          <div class="worked-card">
            <div>
              <span class="summary-label">Question</span>
              <strong>{{ workedExample.prompt }}</strong>
            </div>
            <div>
              <span class="summary-label">Strategy</span>
              <p>{{ workedExample.hint }}</p>
            </div>
            <div>
              <span class="summary-label">Working</span>
              <p>{{ workedExample.working }}</p>
            </div>
            <div>
              <span class="summary-label">Answer</span>
              <strong>{{ workedExample.answer }}</strong>
            </div>
          </div>
        </article>

        <article v-if="settings.includePractice" class="sheet">
          <header class="sheet-section-header">
            <h2>Practice Questions</h2>
            <span>{{ skillProblems.length }} questions</span>
          </header>
          <div class="problem-grid">
            <div v-for="problem in skillProblems" :key="`skill-${problem.id}`" class="problem-row">
              <span class="problem-number">{{ problem.id }}.</span>
              <span class="problem-prompt">{{ problem.prompt }}</span>
              <strong v-if="settings.showAnswersInline || settings.layout === 'teacher'" class="inline-answer">
                {{ problem.answer }}
              </strong>
              <span v-else-if="settings.includeStrategyHints" class="strategy-line"></span>
            </div>
          </div>
        </article>

        <article v-if="settings.includeWordProblems && wordProblems.length" class="sheet">
          <header class="sheet-section-header">
            <h2>Word Problems</h2>
            <span>Show the multiplication sentence</span>
          </header>
          <div class="word-list">
            <div v-for="problem in wordProblems" :key="`word-${problem.id}`" class="word-problem">
              <p><strong>{{ problem.id }}.</strong> {{ problem.prompt }}</p>
              <div class="working-lines">
                <span>Sentence:</span>
                <span>Working:</span>
                <span>Answer:</span>
              </div>
            </div>
          </div>
        </article>

        <article v-if="settings.includeExitTicket" class="sheet exit-ticket">
          <header class="sheet-section-header">
            <h2>Exit Ticket</h2>
            <span>Last 5 minutes</span>
          </header>
          <div class="exit-grid">
            <div v-for="problem in exitTicket" :key="`exit-${problem.id}`" class="exit-item">
              <span>{{ problem.prompt }}</span>
              <span class="line"></span>
            </div>
          </div>
          <div class="reflection">
            <span>One strategy I used today:</span>
            <span class="wide-line"></span>
          </div>
        </article>

        <article v-if="settings.includeAnswerKey || settings.layout === 'teacher'" class="sheet answer-key">
          <header class="sheet-section-header">
            <h2>Answer Key</h2>
            <span>{{ settings.showWorking ? "With working notes" : "Answers only" }}</span>
          </header>
          <div class="answer-list">
            <div v-for="problem in practiceProblems" :key="`answer-${problem.id}`" class="answer-row">
              <strong>{{ problem.id }}.</strong>
              <span>{{ problem.answer }}</span>
              <em v-if="settings.showWorking">{{ problem.working }}</em>
            </div>
          </div>
        </article>
      </section>
    </div>
  </section>
</template>

<style scoped>
.multiplication-tool {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tool-header,
.sheet-title,
.sheet-section-header,
.summary-strip {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.tool-header {
  flex-wrap: wrap;
}

.tool-header h1,
.sheet-title h2,
.sheet-section-header h2 {
  margin: 0.25rem 0;
  font-family: "Source Serif 4", serif;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.builder-shell {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.settings-panel {
  display: grid;
  gap: 1rem;
  position: sticky;
  top: 96px;
}

.settings-panel details {
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 10px 24px rgba(29, 31, 27, 0.05);
}

.settings-panel summary {
  cursor: pointer;
  font-weight: 700;
  list-style: none;
}

.settings-panel summary::-webkit-details-marker {
  display: none;
}

.settings-body {
  display: grid;
  gap: 0.85rem;
  padding-top: 1rem;
}

.settings-body.two-col {
  grid-template-columns: 1fr 1fr;
}

.settings-body.compact {
  gap: 0.55rem;
}

.settings-body label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.84rem;
  color: var(--ink-muted);
}

.settings-body input,
.settings-body select {
  width: 100%;
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: #fafbfa;
  color: var(--ink-strong);
  padding: 0.55rem 0.65rem;
  font: inherit;
}

.check-row {
  grid-template-columns: auto 1fr;
  align-items: center;
  color: var(--ink-strong) !important;
}

.preview-area {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.summary-strip {
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 10px 24px rgba(29, 31, 27, 0.05);
}

.summary-strip > div {
  display: grid;
  gap: 0.2rem;
}

.summary-label {
  color: var(--ink-muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sheet {
  background: #fff;
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  padding: 1.35rem;
  break-inside: avoid;
  box-shadow: 0 14px 28px rgba(29, 31, 27, 0.05);
}

.sheet-title p,
.sheet-section-header span {
  margin: 0;
  color: var(--ink-muted);
}

.sheet-meta {
  display: grid;
  gap: 0.35rem;
  min-width: 210px;
  font-size: 0.9rem;
  color: var(--ink-muted);
}

.guidance-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.guidance-grid section {
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 0.85rem;
}

.guidance-grid h3,
.fact-card h3 {
  margin: 0 0 0.55rem;
  font-size: 1rem;
}

.guidance-grid ol,
.guidance-grid ul {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--ink-muted);
}

.strategy-band {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;
}

.strategy-band div {
  display: grid;
  gap: 0.2rem;
  border-left: 4px solid var(--accent);
  background: var(--accent-soft);
  border-radius: 10px;
  padding: 0.75rem;
}

.strategy-band span {
  color: var(--ink-muted);
}

.rubric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.6rem;
  margin-top: 1rem;
}

.rubric-strip span {
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  padding: 0.65rem;
  color: var(--ink-muted);
  background: #fafbf8;
}

.grid-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.grid-table {
  width: 100%;
  min-width: max-content;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.92rem;
}

.grid-table th,
.grid-table td {
  border: 1px solid #cfd5cc;
  min-width: 3rem;
  height: 2.35rem;
  text-align: center;
  padding: 0.35rem;
}

.grid-table th {
  background: #edf3ef;
  font-weight: 700;
}

.blank,
.line,
.wide-line {
  display: inline-block;
  border-bottom: 1px solid #aeb7aa;
}

.blank {
  width: 2rem;
  height: 0.9rem;
}

.line {
  flex: 1;
  min-width: 3rem;
  height: 1rem;
}

.wide-line {
  width: 100%;
  height: 1.2rem;
}

.fact-columns {
  columns: 3 180px;
  column-gap: 1rem;
  margin-top: 1rem;
}

.fact-card {
  break-inside: avoid;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 0.8rem;
  margin: 0 0 1rem;
}

.fact-row,
.problem-row,
.exit-item,
.reflection {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
}

.fact-row {
  justify-content: space-between;
  min-height: 1.7rem;
}

.problem-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem 1.5rem;
  margin-top: 1rem;
}

.problem-row {
  min-height: 2rem;
  border-bottom: 1px solid rgba(29, 31, 27, 0.08);
  padding-bottom: 0.35rem;
}

.problem-number {
  width: 2rem;
  color: var(--ink-muted);
}

.problem-prompt {
  flex: 1;
}

.inline-answer {
  color: var(--accent);
}

.strategy-line {
  flex: 0 0 8rem;
  border-bottom: 1px solid #aeb7aa;
}

.worked-card {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 0.9rem;
  margin-top: 1rem;
}

.worked-card > div {
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 0.85rem;
  background: #fafbf8;
}

.worked-card p {
  margin: 0.25rem 0 0;
  color: var(--ink-muted);
}

.word-list {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.word-problem {
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 0.9rem;
}

.word-problem p {
  margin: 0 0 0.75rem;
}

.working-lines {
  display: grid;
  gap: 1rem;
  color: var(--ink-muted);
}

.working-lines span {
  border-bottom: 1px solid #aeb7aa;
  padding-bottom: 0.35rem;
}

.exit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.5rem;
  margin-top: 1rem;
}

.reflection {
  margin-top: 1.2rem;
}

.answer-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem 1.2rem;
  margin-top: 1rem;
}

.answer-row {
  display: grid;
  grid-template-columns: 2rem 4rem 1fr;
  gap: 0.4rem;
  align-items: baseline;
  font-size: 0.9rem;
}

.answer-row em {
  color: var(--ink-muted);
  font-style: normal;
}

@media (max-width: 1080px) {
  .builder-shell {
    grid-template-columns: 1fr;
  }

  .settings-panel {
    position: static;
  }

  .guidance-grid,
  .strategy-band,
  .rubric-strip,
  .problem-grid,
  .exit-grid,
  .answer-list,
  .worked-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .tool-header,
  .sheet-title,
  .sheet-section-header,
  .summary-strip {
    flex-direction: column;
  }

  .header-actions,
  .header-actions button {
    width: 100%;
  }

  .settings-body.two-col {
    grid-template-columns: 1fr;
  }

  .sheet {
    padding: 1rem;
  }
}

@media print {
  .multiplication-tool {
    gap: 0;
  }

  .sheet {
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: 10mm 8mm;
    page-break-inside: avoid;
  }

  .sheet + .sheet {
    page-break-before: always;
  }

  .cover-sheet {
    page-break-after: always;
  }

  .grid-table th,
  .grid-table td {
    border-color: #777;
  }
}
</style>
