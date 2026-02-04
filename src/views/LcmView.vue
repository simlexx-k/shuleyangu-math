<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue"
import { api } from "@/lib/api"
import { useAuthStore } from "@/stores/auth"
import FactorTree from "@/components/FactorTree.vue"

type Method = "prime" | "multiples" | "formula"
type OutputType = "student" | "teacher"
type Student = { id: number; name: string; class_level?: string }
type Course = { id: number; title: string }

const auth = useAuthStore()

const calculator = reactive({
  a: 12,
  b: 18,
  c: 24,
  numbersCount: 2 as 2 | 3,
  method: "prime" as Method,
  showSteps: true,
})

const practice = reactive({
  count: 20,
  minValue: 2,
  maxValue: 100,
  showAnswers: true,
  outputType: "student" as OutputType,
  numbersCount: 2 as 2 | 3,
  method: "prime" as Method,
})

type Problem = { nums: number[]; lcm: number }
const problems = ref<Problem[]>([])
const pdfLoading = ref(false)
const pdfError = ref<string | null>(null)
const calcPdfLoading = ref(false)
const calcPdfError = ref<string | null>(null)
const classPdfLoading = ref(false)
const classPdfError = ref<string | null>(null)

const classLevels = ref<string[]>([])
const classLevelLoading = ref(false)
const classLevelError = ref<string | null>(null)
const selectedClassLevel = ref("")
const students = ref<Student[]>([])
const studentsLoading = ref(false)
const studentsError = ref<string | null>(null)
const selectedStudentIds = ref<number[]>([])
const courses = ref<Course[]>([])
const coursesLoading = ref(false)
const coursesError = ref<string | null>(null)
const selectedCourseId = ref<number | "">("")
const classSeed = ref<number | null>(null)
const classQuizSuccess = ref<string | null>(null)
const classQuizLoading = ref(false)
const studentQuery = ref("")

function normalizeBounds(a: number, b: number) {
  const min = Math.max(1, Math.min(a, b))
  const max = Math.max(1, Math.max(a, b))
  return { min, max }
}

function gcd(a: number, b: number) {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const r = x % y
    x = y
    y = r
  }
  return x
}

function lcm(a: number, b: number) {
  if (a === 0 || b === 0) return 0
  return Math.abs((a * b) / gcd(a, b))
}

function lcmMany(values: number[]) {
  if (!values.length) return 0
  return values.reduce((acc, val) => lcm(acc, val))
}

function primeFactors(n: number) {
  const factors: number[] = []
  let num = Math.abs(n)
  let divisor = 2
  while (num >= 2) {
    if (num % divisor === 0) {
      factors.push(divisor)
      num /= divisor
    } else {
      divisor += divisor === 2 ? 1 : 2
    }
  }
  return factors
}

function factorCounts(n: number) {
  const counts = new Map<number, number>()
  for (const f of primeFactors(n)) {
    counts.set(f, (counts.get(f) || 0) + 1)
  }
  return counts
}

function formatCountsHtml(counts: Map<number, number>) {
  if (!counts.size) return ""
  const parts = Array.from(counts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([prime, exp]) => (exp > 1 ? `${prime}<sup>${exp}</sup>` : `${prime}`))
  return parts.join(" × ")
}

function factorLadderLines(n: number) {
  const num = Math.abs(n)
  if (num <= 1) return [String(n)]
  const lines: string[] = []
  let divisor = 2
  let current = num
  while (current > 1) {
    if (current % divisor === 0) {
      lines.push(`${current} | ${divisor}`)
      current = current / divisor
    } else {
      divisor += divisor === 2 ? 1 : 2
    }
  }
  lines.push(String(current))
  return lines
}

function multiples(n: number, count: number) {
  return Array.from({ length: count }, (_, idx) => n * (idx + 1))
}

const lcmResult = computed(() => {
  if (calculator.numbersCount === 3) {
    return lcmMany([calculator.a, calculator.b, calculator.c])
  }
  return lcm(calculator.a, calculator.b)
})

const primeInfo = computed(() => {
  const values = calculator.numbersCount === 3
    ? [calculator.a, calculator.b, calculator.c]
    : [calculator.a, calculator.b]
  const factorMaps = values.map((value) => factorCounts(value))
  const lcmCounts = new Map<number, number>()
  for (const map of factorMaps) {
    for (const [prime, exp] of map.entries()) {
      lcmCounts.set(prime, Math.max(lcmCounts.get(prime) || 0, exp))
    }
  }
  return {
    values,
    factorMaps,
    factorsHtml: factorMaps.map((map) => formatCountsHtml(map)),
    lcmHtml: formatCountsHtml(lcmCounts),
    lcm: lcmMany(values),
  }
})

const multiplesInfo = computed(() => {
  const values = calculator.numbersCount === 3
    ? [calculator.a, calculator.b, calculator.c]
    : [calculator.a, calculator.b]
  const limit = 12
  const lists = values.map((value) => multiples(value, limit))
  const common = lists.reduce((acc, list) => acc.filter((val) => list.includes(val)))
  const lcmValue = lcmMany(values)
  return {
    values,
    lists,
    common,
    lcm: lcmValue,
    lcmInList: common.includes(lcmValue),
    limit,
  }
})

const formulaSteps = computed(() => {
  const a = calculator.a
  const b = calculator.b
  const gcdAB = gcd(a, b)
  const lcmAB = lcm(a, b)
  const steps = [
    `LCM(${a}, ${b}) = |${a} × ${b}| / gcd(${a}, ${b}) = ${a * b} / ${gcdAB} = ${lcmAB}`,
  ]
  if (calculator.numbersCount === 3) {
    const c = calculator.c
    const gcdBC = gcd(lcmAB, c)
    const lcmABC = lcm(lcmAB, c)
    steps.push(
      `LCM(${lcmAB}, ${c}) = |${lcmAB} × ${c}| / gcd(${lcmAB}, ${c}) = ${lcmAB * c} / ${gcdBC} = ${lcmABC}`,
    )
  }
  return steps
})

const ladderA = computed(() => factorLadderLines(calculator.a))
const ladderB = computed(() => factorLadderLines(calculator.b))
const ladderC = computed(() => factorLadderLines(calculator.c))

function generateProblems() {
  const { min, max } = normalizeBounds(practice.minValue, practice.maxValue)
  const total = Math.max(1, Math.min(practice.count, 200))
  const list: Problem[] = []
  for (let i = 0; i < total; i += 1) {
    const nums = Array.from({ length: practice.numbersCount }, () =>
      Math.floor(Math.random() * (max - min + 1)) + min,
    )
    list.push({ nums, lcm: lcmMany(nums) })
  }
  problems.value = list
}

generateProblems()

const filteredStudents = computed(() => {
  const query = studentQuery.value.trim().toLowerCase()
  if (!query) return students.value
  return students.value.filter((student) => student.name.toLowerCase().includes(query))
})

const allStudentsSelected = computed(() => {
  return (
    filteredStudents.value.length > 0 &&
    filteredStudents.value.every((student) => selectedStudentIds.value.includes(student.id))
  )
})

function toggleAllStudents() {
  if (allStudentsSelected.value) {
    const filteredIds = new Set(filteredStudents.value.map((student) => student.id))
    selectedStudentIds.value = selectedStudentIds.value.filter((id) => !filteredIds.has(id))
  } else {
    const merged = new Set(selectedStudentIds.value)
    for (const student of filteredStudents.value) {
      merged.add(student.id)
    }
    selectedStudentIds.value = Array.from(merged)
  }
}

async function loadClassLevels() {
  classLevelError.value = null
  classLevelLoading.value = true
  try {
    const data = await api<string[]>("students/class-levels", "GET", { auth: true })
    classLevels.value = data
  } catch (err: any) {
    classLevelError.value = err?.message || "Failed to load class levels"
  } finally {
    classLevelLoading.value = false
  }
}

async function loadStudentsForClass(classLevel: string) {
  studentsError.value = null
  studentsLoading.value = true
  selectedStudentIds.value = []
  try {
    const schoolId = auth.user?.school_id
    if (!schoolId) {
      throw new Error("Missing school ID")
    }
    const data = await api<Student[]>("students/", "GET", {
      auth: true,
      query: {
        school_id: schoolId,
        class_level: classLevel,
      },
    })
    students.value = data
  } catch (err: any) {
    studentsError.value = err?.message || "Failed to load students"
    students.value = []
  } finally {
    studentsLoading.value = false
  }
}

async function loadCoursesForClass(classLevel: string) {
  coursesError.value = null
  coursesLoading.value = true
  selectedCourseId.value = ""
  try {
    const schoolId = auth.user?.school_id
    if (!schoolId) {
      throw new Error("Missing school ID")
    }
    const data = await api<Course[]>("courses/", "GET", {
      auth: true,
      query: {
        school_id: schoolId,
        class_level: classLevel,
      },
    })
    courses.value = data
  } catch (err: any) {
    coursesError.value = err?.message || "Failed to load courses"
    courses.value = []
  } finally {
    coursesLoading.value = false
  }
}

onMounted(() => {
  loadClassLevels()
})

watch(selectedClassLevel, (value) => {
  if (value) {
    loadStudentsForClass(value)
    loadCoursesForClass(value)
  } else {
    students.value = []
    selectedStudentIds.value = []
    courses.value = []
    selectedCourseId.value = ""
  }
})

watch(
  () => [
    practice.count,
    practice.minValue,
    practice.maxValue,
    practice.numbersCount,
    practice.method,
    selectedClassLevel.value,
  ],
  () => {
    classSeed.value = null
    classQuizSuccess.value = null
  },
)

async function downloadPdf() {
  pdfError.value = null
  pdfLoading.value = true
  try {
    const { min, max } = normalizeBounds(practice.minValue, practice.maxValue)
    const payload = {
      count: Math.max(1, Math.min(practice.count, 200)),
      min_value: min,
      max_value: max,
      numbers_count: practice.numbersCount,
      output_type: practice.outputType,
      method: practice.method,
      title: "LCM Practice",
    }
    const blob = await api<Blob>("math/lcm/printouts/pdf", "POST", {
      auth: true,
      body: payload,
      responseType: "blob",
    })
    const url = URL.createObjectURL(blob)
    const stamp = new Date().toISOString().slice(0, 10)
    const link = document.createElement("a")
    link.href = url
    link.download = `lcm_${practice.outputType}_printouts_${stamp}.pdf`
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

async function downloadCalculatorPdf() {
  calcPdfError.value = null
  calcPdfLoading.value = true
  try {
    const numbers = calculator.numbersCount === 3
      ? [calculator.a, calculator.b, calculator.c]
      : [calculator.a, calculator.b]
    const payload = {
      numbers,
      method: calculator.method,
      show_steps: calculator.showSteps,
      title: "LCM Calculator",
    }
    const blob = await api<Blob>("math/lcm/calculator/pdf", "POST", {
      auth: true,
      body: payload,
      responseType: "blob",
    })
    const url = URL.createObjectURL(blob)
    const stamp = new Date().toISOString().slice(0, 10)
    const link = document.createElement("a")
    link.href = url
    link.download = `lcm_calculator_${stamp}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    calcPdfError.value = err?.message || "Failed to generate calculator PDF"
  } finally {
    calcPdfLoading.value = false
  }
}

async function downloadClassPdf() {
  classPdfError.value = null
  classPdfLoading.value = true
  classQuizSuccess.value = null
  try {
    if (!selectedClassLevel.value || selectedStudentIds.value.length === 0) {
      throw new Error("Select a class level and at least one student.")
    }
    const { min, max } = normalizeBounds(practice.minValue, practice.maxValue)
    if (!classSeed.value) {
      classSeed.value = Math.floor(Date.now() + Math.random() * 1000)
    }
    const payload = {
      count: Math.max(1, Math.min(practice.count, 200)),
      min_value: min,
      max_value: max,
      numbers_count: practice.numbersCount,
      output_type: practice.outputType,
      method: practice.method,
      class_level: selectedClassLevel.value,
      student_ids: selectedStudentIds.value,
      seed: classSeed.value,
      title: "LCM Practice",
    }
    const blob = await api<Blob>("math/lcm/printouts/class/pdf", "POST", {
      auth: true,
      body: payload,
      responseType: "blob",
    })
    const url = URL.createObjectURL(blob)
    const stamp = new Date().toISOString().slice(0, 10)
    const slug = selectedClassLevel.value.toLowerCase().replace(/\s+/g, "-")
    const link = document.createElement("a")
    link.href = url
    link.download = `lcm_${slug}_${stamp}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    classPdfError.value = err?.message || "Failed to generate class PDF"
  } finally {
    classPdfLoading.value = false
  }
}

async function pushClassToQuiz() {
  classPdfError.value = null
  classQuizSuccess.value = null
  classQuizLoading.value = true
  try {
    if (!selectedClassLevel.value || selectedStudentIds.value.length === 0) {
      throw new Error("Select a class level and at least one student.")
    }
    if (!selectedCourseId.value) {
      throw new Error("Select a course to attach the quiz.")
    }
    const { min, max } = normalizeBounds(practice.minValue, practice.maxValue)
    if (!classSeed.value) {
      classSeed.value = Math.floor(Date.now() + Math.random() * 1000)
    }
    const payload = {
      count: Math.max(1, Math.min(practice.count, 200)),
      min_value: min,
      max_value: max,
      numbers_count: practice.numbersCount,
      method: practice.method,
      class_level: selectedClassLevel.value,
      student_ids: selectedStudentIds.value,
      course_id: selectedCourseId.value,
      seed: classSeed.value,
      title: "LCM Practice",
    }
    await api("math/lcm/quiz", "POST", { auth: true, body: payload })
    classQuizSuccess.value = "Quiz created and linked to the selected class."
  } catch (err: any) {
    classPdfError.value = err?.message || "Failed to create quiz"
  } finally {
    classQuizLoading.value = false
  }
}
</script>

<template>
  <section class="lcm">
    <div class="lcm-header">
      <div>
        <p class="eyebrow">Math Tool</p>
        <h1>LCM Explorer</h1>
        <p class="subtle">Compute least common multiples and generate practice worksheets.</p>
      </div>
      <div class="header-actions no-print">
        <button class="secondary" type="button" @click="generateProblems">New practice set</button>
        <button class="primary" type="button" :disabled="pdfLoading" @click="downloadPdf">
          {{ pdfLoading ? "Preparing PDF..." : "Download PDF" }}
        </button>
      </div>
    </div>

    <p v-if="pdfError" class="error no-print">{{ pdfError }}</p>
    <p v-if="calcPdfError" class="error no-print">{{ calcPdfError }}</p>
    <p v-if="classPdfError" class="error no-print">{{ classPdfError }}</p>
    <p v-if="classQuizSuccess" class="success no-print">{{ classQuizSuccess }}</p>

    <div class="lcm-grid">
      <section class="card">
        <h2>Calculator</h2>
        <div class="field-row">
          <label>
            <span>Number A</span>
            <input v-model.number="calculator.a" type="number" min="1" />
          </label>
          <label>
            <span>Number B</span>
            <input v-model.number="calculator.b" type="number" min="1" />
          </label>
          <label v-if="calculator.numbersCount === 3">
            <span>Number C</span>
            <input v-model.number="calculator.c" type="number" min="1" />
          </label>
        </div>
        <label>
          <span>Numbers</span>
          <select v-model.number="calculator.numbersCount">
            <option :value="2">2 numbers</option>
            <option :value="3">3 numbers</option>
          </select>
        </label>
        <label>
          <span>Method</span>
          <select v-model="calculator.method">
            <option value="prime">Prime factorization</option>
            <option value="multiples">List multiples</option>
            <option value="formula">GCD formula</option>
          </select>
        </label>
        <label class="toggle">
          <input v-model="calculator.showSteps" type="checkbox" />
          <span>Show steps</span>
        </label>

        <div class="result">
          <span class="stat-label">LCM</span>
          <span class="stat-value">{{ lcmResult }}</span>
        </div>

        <button class="secondary no-print" type="button" :disabled="calcPdfLoading" @click="downloadCalculatorPdf">
          {{ calcPdfLoading ? "Preparing PDF..." : "Download calculation PDF" }}
        </button>

        <div v-if="calculator.showSteps && calculator.method === 'prime'" class="steps">
          <h3>Prime factor steps</h3>
          <p v-for="(value, idx) in primeInfo.values" :key="`prime-${idx}`">
            {{ value }} =
            <span v-if="primeInfo.factorsHtml[idx]" v-html="primeInfo.factorsHtml[idx]"></span>
            <span v-else>{{ value }}</span>
          </p>
          <p>
            <strong>
              LCM =
              <span v-if="primeInfo.lcmHtml" v-html="primeInfo.lcmHtml"></span>
              <span v-else>{{ primeInfo.lcm }}</span>
              = {{ primeInfo.lcm }}
            </strong>
          </p>

          <div class="tree-grid">
            <div>
              <h4>Factor tree (A)</h4>
              <FactorTree :value="calculator.a" />
            </div>
            <div>
              <h4>Factor tree (B)</h4>
              <FactorTree :value="calculator.b" />
            </div>
            <div v-if="calculator.numbersCount === 3">
              <h4>Factor tree (C)</h4>
              <FactorTree :value="calculator.c" />
            </div>
            <div>
              <h4>Factor ladder (A)</h4>
              <pre class="mono-block">{{ ladderA.join("\n") }}</pre>
            </div>
            <div>
              <h4>Factor ladder (B)</h4>
              <pre class="mono-block">{{ ladderB.join("\n") }}</pre>
            </div>
            <div v-if="calculator.numbersCount === 3">
              <h4>Factor ladder (C)</h4>
              <pre class="mono-block">{{ ladderC.join("\n") }}</pre>
            </div>
          </div>
        </div>

        <div v-if="calculator.showSteps && calculator.method === 'multiples'" class="steps">
          <h3>Listing multiples</h3>
          <p v-for="(value, idx) in multiplesInfo.values" :key="`multi-${idx}`">
            Multiples of {{ value }}:
            <span>{{ multiplesInfo.lists[idx]?.join(", ") || "" }}</span>
          </p>
          <p>Common multiples (first {{ multiplesInfo.limit }}): {{ multiplesInfo.common.join(", ") || "None" }}</p>
          <p v-if="!multiplesInfo.lcmInList" class="subtle">LCM is beyond the listed multiples.</p>
          <p><strong>LCM = {{ multiplesInfo.lcm }}</strong></p>
        </div>

        <div v-if="calculator.showSteps && calculator.method === 'formula'" class="steps">
          <h3>GCD formula steps</h3>
          <ol>
            <li v-for="(step, idx) in formulaSteps" :key="`formula-${idx}`">{{ step }}</li>
          </ol>
        </div>
      </section>

      <section class="card">
        <h2>Practice generator</h2>
        <div class="field-row">
          <label>
            <span>Questions</span>
            <input v-model.number="practice.count" type="number" min="1" max="200" />
          </label>
          <label>
            <span>Min value</span>
            <input v-model.number="practice.minValue" type="number" min="1" max="5000" />
          </label>
          <label>
            <span>Max value</span>
            <input v-model.number="practice.maxValue" type="number" min="1" max="5000" />
          </label>
          <label>
            <span>Numbers per task</span>
            <select v-model.number="practice.numbersCount">
              <option :value="2">2 numbers</option>
              <option :value="3">3 numbers</option>
            </select>
          </label>
        </div>
        <label class="toggle">
          <input v-model="practice.showAnswers" type="checkbox" />
          <span>Show answers in preview</span>
        </label>
        <label>
          <span>Worksheet method</span>
          <select v-model="practice.method">
            <option value="prime">Prime factorization</option>
            <option value="multiples">List multiples</option>
            <option value="formula">GCD formula</option>
          </select>
        </label>
        <label>
          <span>PDF version</span>
          <select v-model="practice.outputType">
            <option value="student">Student worksheet</option>
            <option value="teacher">Teacher copy (solved)</option>
          </select>
        </label>

        <div class="class-panel">
          <div class="class-header">
            <h3>Class printouts</h3>
            <button class="ghost" type="button" @click="loadClassLevels">Refresh</button>
          </div>
          <label>
            <span>Class level</span>
            <select v-model="selectedClassLevel" :disabled="classLevelLoading">
              <option value="">Select class level</option>
              <option v-for="level in classLevels" :key="level" :value="level">{{ level }}</option>
            </select>
          </label>
          <p v-if="classLevelError" class="error">{{ classLevelError }}</p>
          <label>
            <span>Course</span>
            <select v-model.number="selectedCourseId" :disabled="coursesLoading || !selectedClassLevel">
              <option value="">Select course</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.title }}
              </option>
            </select>
          </label>
          <p v-if="coursesError" class="error">{{ coursesError }}</p>

          <div class="student-list">
            <div class="student-list-header">
              <span>Students</span>
              <span v-if="students.length">{{ selectedStudentIds.length }}/{{ students.length }} selected</span>
            </div>
            <label class="student-search">
              <span>Search</span>
              <input v-model="studentQuery" type="search" placeholder="Search student name" />
            </label>
            <div v-if="studentsLoading" class="subtle">Loading students...</div>
            <div v-else-if="studentsError" class="error">{{ studentsError }}</div>
            <div v-else-if="!selectedClassLevel" class="subtle">Select a class level to load students.</div>
            <div v-else-if="students.length === 0" class="subtle">No students found for this class.</div>
            <div v-else-if="filteredStudents.length === 0" class="subtle">No matches for this search.</div>
            <div v-else class="student-scroll">
              <div class="student-row header">
                <label>
                  <input type="checkbox" :checked="allStudentsSelected" @change="toggleAllStudents" />
                </label>
                <span>Name</span>
              </div>
              <label v-for="student in filteredStudents" :key="student.id" class="student-row">
                <input v-model="selectedStudentIds" type="checkbox" :value="student.id" />
                <span class="student-name">{{ student.name }}</span>
              </label>
            </div>
          </div>

          <button
            class="primary"
            type="button"
            :disabled="classPdfLoading || selectedStudentIds.length === 0 || !selectedClassLevel"
            @click="downloadClassPdf"
          >
            {{ classPdfLoading ? "Preparing class PDF..." : "Download combined PDF" }}
          </button>
          <button
            class="secondary"
            type="button"
            :disabled="
              classQuizLoading ||
              selectedStudentIds.length === 0 ||
              !selectedClassLevel ||
              !selectedCourseId
            "
            @click="pushClassToQuiz"
          >
            {{ classQuizLoading ? "Pushing to quiz..." : "Push to quiz" }}
          </button>
        </div>

        <div class="practice-list">
          <div v-for="(item, idx) in problems" :key="`${item.nums.join('-')}-${idx}`" class="practice-row">
            <span>{{ idx + 1 }}. LCM({{ item.nums.join(", ") }})</span>
            <span v-if="practice.showAnswers" class="answer">{{ item.lcm }}</span>
            <span v-else class="line"></span>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.lcm {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.lcm-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: flex-start;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.lcm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
  box-shadow: 0 16px 30px rgba(29, 31, 27, 0.06);
}

.card h2 {
  margin: 0;
  font-family: "Source Serif 4", serif;
}

.field-row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--ink-muted);
}

input,
select {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: #fafbfa;
  font-size: 0.95rem;
  width: 100%;
}

.result {
  display: grid;
  gap: 0.2rem;
  padding: 0.75rem 1rem;
  border-radius: 14px;
  background: var(--accent-soft);
}

.steps {
  background: #fafbfa;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  color: var(--ink-muted);
}

.steps ol {
  margin: 0.5rem 0 0 1rem;
  padding: 0;
}

.tree-grid {
  margin-top: 0.75rem;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.tree-grid h4 {
  margin: 0 0 0.35rem;
  font-size: 0.85rem;
  color: var(--ink-strong);
}

.mono-block {
  background: #fff;
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  padding: 0.6rem;
  font-family: "Courier New", Courier, monospace;
  font-size: 0.8rem;
  color: var(--ink-strong);
  white-space: pre;
  overflow-x: auto;
}

.practice-list {
  display: grid;
  gap: 0.5rem;
  max-height: 360px;
  overflow: auto;
  padding-right: 0.25rem;
}

.practice-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.4rem 0.6rem;
  border-radius: 10px;
  background: #fafbfa;
  font-size: 0.9rem;
}

.practice-row .answer {
  font-weight: 600;
  color: var(--accent);
}

.practice-row .line {
  flex: 1;
  border-bottom: 1px solid #c2c6bf;
}

.class-panel {
  display: grid;
  gap: 0.75rem;
  padding: 0.85rem;
  border-radius: 14px;
  border: 1px dashed var(--border-soft);
  background: #ffffff;
}

.class-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.class-panel h3 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--ink-strong);
}

.student-list {
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 0.6rem;
  background: #fafbfa;
  display: grid;
  gap: 0.5rem;
}

.student-list-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--ink-muted);
}

.student-scroll {
  max-height: 220px;
  overflow: auto;
  display: grid;
  gap: 0.2rem;
  padding-right: 0.2rem;
}

.student-row {
  display: grid;
  grid-template-columns: 28px 1fr;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--ink-strong);
  padding: 0.35rem 0.3rem;
  border-radius: 8px;
}

.student-row.header {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-muted);
  background: #f1f4ef;
}

.student-row:hover {
  background: #ffffff;
}

.student-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.student-search {
  display: grid;
  gap: 0.35rem;
  font-size: 0.8rem;
}

.student-search input {
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  border: 1px solid var(--border-soft);
  background: #fff;
}

.success {
  background: var(--accent-soft);
  color: var(--accent);
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  font-size: 0.9rem;
}

@media (max-width: 720px) {
  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .header-actions button {
    width: 100%;
  }
}
</style>
