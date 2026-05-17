<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue"
import { api } from "@/lib/api"
import { useAuthStore } from "@/stores/auth"

type ActivitySummary = {
  id: number
  title: string
  description?: string | null
  grade_label?: string | null
  activity_type: string
  question_count: number
  code_count: number
  attempt_count: number
  submitted_count: number
  average_percentage?: number | null
  created_at?: string | null
}

type ActivityCode = {
  id: number
  code: string
  label?: string | null
  student_id?: number | null
  student_name?: string | null
  max_uses?: number | null
  used_count: number
  is_active: boolean
}

type ActivityDetail = ActivitySummary & {
  codes: ActivityCode[]
  questions?: Array<{
    number: number
    kind: string
    prompt: string
    marks: number
    options?: Array<{ label: string; text: string }>
  }>
  attempts: Array<{
    id: number
    learner_name?: string | null
    code?: string | null
    score?: number | null
    total?: number | null
    percentage_score?: number | null
    is_submitted: boolean
  }>
}

type QueezyQuiz = {
  id: number
  title: string
  description?: string | null
  school_id: number
  course_id: number
  course_title?: string | null
  class_level?: string | null
  questions?: Array<{ id: number; is_included?: boolean }>
}

const activities = ref<ActivitySummary[]>([])
const selected = ref<ActivityDetail | null>(null)
const quizzes = ref<QueezyQuiz[]>([])
const quizLoading = ref(false)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const codeLoading = ref(false)
const importLoading = ref(false)
const importSuccess = ref<string | null>(null)
const auth = useAuthStore()

const form = reactive({
  title: "Multiplication Fluency Game",
  description: "Interactive multiplication practice for today's lesson.",
  gradeLabel: "Grade 4",
  stream: "",
  activityType: "practice",
  problemCount: 12,
  factorStart: 1,
  factorEnd: 12,
  tableStart: 1,
  tableEnd: 12,
  codeMaxUses: 1,
  allowNickname: true,
  showFeedback: true,
})

const importForm = reactive({
  quizId: 0,
  title: "",
  description: "",
  gradeLabel: "",
  stream: "",
  activityType: "practice",
  codeMaxUses: 1,
  allowNickname: true,
  showFeedback: true,
  onlyIncludedQuestions: true,
})

const gradeOptions = ["PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"]

const selectedCodes = computed(() => selected.value?.codes ?? [])
const playUrl = computed(() => `${window.location.origin}/play`)
const selectedQuiz = computed(() => quizzes.value.find((quiz) => quiz.id === importForm.quizId) ?? null)
const selectedQuestionCount = computed(() => selectedQuiz.value?.questions?.filter((question) => importForm.onlyIncludedQuestions ? question.is_included !== false : true).length ?? 0)

async function loadActivities() {
  loading.value = true
  error.value = null
  try {
    activities.value = await api<ActivitySummary[]>("math/activities", "GET", { auth: true })
    if (!selected.value && activities.value[0]) {
      await loadActivity(activities.value[0].id)
    }
  } catch (err: any) {
    error.value = err?.message || "Failed to load activities"
  } finally {
    loading.value = false
  }
}

async function loadQuizzes() {
  quizLoading.value = true
  try {
    const schoolId = auth.user?.school_id
    quizzes.value = await api<QueezyQuiz[]>("quizzes/", "GET", {
      auth: true,
      query: {
        school_id: schoolId || undefined,
        is_active: true,
      },
    })
    if (!importForm.quizId && quizzes.value[0]) {
      selectQuiz(quizzes.value[0].id)
    }
  } catch (err: any) {
    error.value = err?.message || "Failed to load Queezy quizzes"
  } finally {
    quizLoading.value = false
  }
}

async function loadActivity(id: number) {
  error.value = null
  selected.value = await api<ActivityDetail>(`math/activities/${id}`, "GET", { auth: true })
}

async function createActivity() {
  saving.value = true
  error.value = null
  try {
    const created = await api<ActivityDetail>("math/activities", "POST", {
      auth: true,
      body: {
        title: form.title,
        description: form.description,
        grade_label: form.gradeLabel,
        stream: form.stream || null,
        activity_type: form.activityType,
        problem_count: form.problemCount,
        factor_start: form.factorStart,
        factor_end: form.factorEnd,
        table_start: form.tableStart,
        table_end: form.tableEnd,
        code_max_uses: form.codeMaxUses,
        allow_nickname: form.allowNickname,
        show_feedback: form.showFeedback,
      },
    })
    selected.value = created
    await loadActivities()
    await loadActivity(created.id)
  } catch (err: any) {
    error.value = err?.message || "Failed to create activity"
  } finally {
    saving.value = false
  }
}

function selectQuiz(quizId: number) {
  importForm.quizId = quizId
  const quiz = quizzes.value.find((item) => item.id === quizId)
  if (!quiz) return
  importForm.title = `${quiz.title} - STEM Mobile`
  importForm.description = quiz.description || ""
  importForm.gradeLabel = quiz.class_level || form.gradeLabel
}

async function importQuizAssignment() {
  if (!importForm.quizId) {
    error.value = "Select a Queezy quiz to import."
    return
  }
  importLoading.value = true
  error.value = null
  importSuccess.value = null
  try {
    const created = await api<ActivityDetail>("math/activities/import-quiz", "POST", {
      auth: true,
      body: {
        quiz_id: importForm.quizId,
        title: importForm.title || null,
        description: importForm.description || null,
        grade_label: importForm.gradeLabel || null,
        stream: importForm.stream || null,
        activity_type: importForm.activityType,
        code_max_uses: importForm.codeMaxUses,
        allow_nickname: importForm.allowNickname,
        show_feedback: importForm.showFeedback,
        only_included_questions: importForm.onlyIncludedQuestions,
      },
    })
    selected.value = created
    importSuccess.value = `Imported "${created.title}" with ${created.question_count} questions and ${created.code_count} student codes.`
    await loadActivities()
    await loadActivity(created.id)
  } catch (err: any) {
    error.value = err?.message || "Failed to import Queezy quiz"
  } finally {
    importLoading.value = false
  }
}

async function addCodes() {
  if (!selected.value) return
  codeLoading.value = true
  error.value = null
  try {
    await api(`math/activities/${selected.value.id}/codes`, "POST", {
      auth: true,
      body: { max_uses: form.codeMaxUses, only_missing_students: true },
    })
    await loadActivity(selected.value.id)
    await loadActivities()
  } catch (err: any) {
    error.value = err?.message || "Failed to add codes"
  } finally {
    codeLoading.value = false
  }
}

async function downloadCodesPdf() {
  if (!selected.value) return
  const blob = await api<Blob>(`math/activities/${selected.value.id}/codes/pdf`, "GET", {
    auth: true,
    responseType: "blob",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `student_activity_codes_${selected.value.id}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  await auth.bootstrap()
  await Promise.all([loadActivities(), loadQuizzes()])
})
</script>

<template>
  <section class="activities-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Teacher Tool</p>
        <h1>Student Math Activities</h1>
        <p class="subtle">Generate join codes for interactive student practice and print slips for class distribution.</p>
      </div>
      <RouterLink class="secondary" to="/play">Open Student Play</RouterLink>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="activity-layout">
      <form class="panel create-panel" @submit.prevent="createActivity">
        <p class="eyebrow">Generated assignment</p>
        <h2>Create multiplication activity</h2>
        <label>
          <span>Title</span>
          <input v-model="form.title" required />
        </label>
        <label>
          <span>Description</span>
          <textarea v-model="form.description" rows="3"></textarea>
        </label>
        <div class="field-grid">
          <label>
            <span>Grade</span>
            <select v-model="form.gradeLabel">
              <option v-for="grade in gradeOptions" :key="grade" :value="grade">{{ grade }}</option>
            </select>
          </label>
          <label>
            <span>Stream</span>
            <input v-model="form.stream" placeholder="Optional" />
          </label>
          <label>
            <span>Mode</span>
            <select v-model="form.activityType">
              <option value="practice">Practice</option>
              <option value="fluency">Fluency</option>
              <option value="challenge">Challenge</option>
            </select>
          </label>
          <label>
            <span>Questions</span>
            <input v-model.number="form.problemCount" type="number" min="4" max="40" />
          </label>
          <label>
            <span>Uses per code</span>
            <input v-model.number="form.codeMaxUses" type="number" min="1" max="100" />
          </label>
          <label>
            <span>Factor start</span>
            <input v-model.number="form.factorStart" type="number" min="1" max="20" />
          </label>
          <label>
            <span>Factor end</span>
            <input v-model.number="form.factorEnd" type="number" min="1" max="20" />
          </label>
          <label>
            <span>Table start</span>
            <input v-model.number="form.tableStart" type="number" min="1" max="20" />
          </label>
          <label>
            <span>Table end</span>
            <input v-model.number="form.tableEnd" type="number" min="1" max="20" />
          </label>
        </div>
        <p class="hint">Codes are generated automatically from active students in the selected class and stream.</p>
        <label class="check-row"><input v-model="form.allowNickname" type="checkbox" /> Allow learner name</label>
        <label class="check-row"><input v-model="form.showFeedback" type="checkbox" /> Show feedback after submit</label>
        <button class="primary" type="submit" :disabled="saving">{{ saving ? "Creating..." : "Create codes" }}</button>
      </form>

      <section class="activity-main">
        <form class="panel import-panel" @submit.prevent="importQuizAssignment">
          <div class="panel-title">
            <div>
              <p class="eyebrow">Queezy bridge</p>
              <h2>Port quiz to STEM mobile</h2>
              <p class="subtle">Turn a Queezy quiz into student-specific activity codes for the STEM mobile app.</p>
            </div>
            <button class="ghost" type="button" :disabled="quizLoading" @click="loadQuizzes">
              {{ quizLoading ? "Loading..." : "Refresh quizzes" }}
            </button>
          </div>

          <div class="field-grid import-grid">
            <label>
              <span>Queezy quiz</span>
              <select :value="importForm.quizId" required @change="selectQuiz(Number(($event.target as HTMLSelectElement).value))">
                <option :value="0" disabled>Select quiz</option>
                <option v-for="quiz in quizzes" :key="quiz.id" :value="quiz.id">
                  {{ quiz.title }}{{ quiz.class_level ? ` · ${quiz.class_level}` : "" }}
                </option>
              </select>
            </label>
            <label>
              <span>Class level</span>
              <select v-model="importForm.gradeLabel" required>
                <option value="" disabled>Select class</option>
                <option v-for="grade in gradeOptions" :key="grade" :value="grade">{{ grade }}</option>
              </select>
            </label>
            <label>
              <span>Stream</span>
              <input v-model="importForm.stream" placeholder="Optional" />
            </label>
            <label>
              <span>Mode</span>
              <select v-model="importForm.activityType">
                <option value="practice">Practice</option>
                <option value="fluency">Fluency</option>
                <option value="challenge">Challenge</option>
              </select>
            </label>
            <label>
              <span>Uses per code</span>
              <input v-model.number="importForm.codeMaxUses" type="number" min="1" max="100" />
            </label>
            <label>
              <span>Mobile title</span>
              <input v-model="importForm.title" placeholder="Defaults to quiz title" />
            </label>
          </div>

          <label>
            <span>Description</span>
            <textarea v-model="importForm.description" rows="2"></textarea>
          </label>

          <div class="import-summary">
            <div>
              <span class="stat-label">Questions to port</span>
              <strong>{{ selectedQuestionCount || "—" }}</strong>
            </div>
            <div>
              <span class="stat-label">Code source</span>
              <strong>Active class roster</strong>
            </div>
            <div>
              <span class="stat-label">Mobile flow</span>
              <strong>Code or QR</strong>
            </div>
          </div>

          <div class="check-grid">
            <label class="check-row"><input v-model="importForm.onlyIncludedQuestions" type="checkbox" /> Only included questions</label>
            <label class="check-row"><input v-model="importForm.allowNickname" type="checkbox" /> Allow learner name</label>
            <label class="check-row"><input v-model="importForm.showFeedback" type="checkbox" /> Show feedback after submit</label>
          </div>

          <button class="primary" type="submit" :disabled="importLoading || !importForm.quizId">
            {{ importLoading ? "Importing..." : "Import quiz and create codes" }}
          </button>
          <p v-if="importSuccess" class="success">{{ importSuccess }}</p>
        </form>

        <div class="panel">
          <div class="panel-title">
            <h2>Activities</h2>
            <button class="ghost" type="button" @click="loadActivities">{{ loading ? "Loading..." : "Refresh" }}</button>
          </div>
          <div class="activity-list">
            <button
              v-for="activity in activities"
              :key="activity.id"
              :class="selected?.id === activity.id ? 'activity-item active' : 'activity-item'"
              type="button"
              @click="loadActivity(activity.id)"
            >
              <strong>{{ activity.title }}</strong>
              <span>{{ activity.grade_label }} · {{ activity.question_count }} questions · {{ activity.code_count }} codes</span>
              <span>{{ activity.submitted_count }} submitted · Avg {{ activity.average_percentage ?? "—" }}%</span>
            </button>
            <p v-if="!activities.length && !loading" class="subtle">No activities yet.</p>
          </div>
        </div>

        <div v-if="selected" class="panel detail-panel">
          <div class="panel-title">
            <div>
              <h2>{{ selected.title }}</h2>
              <p class="subtle">{{ selected.description }}</p>
            </div>
            <div class="detail-actions">
              <button class="ghost" type="button" :disabled="codeLoading" @click="addCodes">Fill missing roster codes</button>
              <button class="primary" type="button" @click="downloadCodesPdf">Print codes PDF</button>
            </div>
          </div>

          <div class="stat-grid compact-stats">
            <div class="stat-card">
              <span class="stat-label">Join page</span>
              <span class="stat-value small">{{ playUrl }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Roster codes</span>
              <span class="stat-value">{{ selected.code_count }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Submitted</span>
              <span class="stat-value">{{ selected.submitted_count }}</span>
            </div>
          </div>

          <h3>Codes</h3>
          <div class="code-grid">
            <div v-for="code in selectedCodes" :key="code.id" class="code-card">
              <strong>{{ code.code }}</strong>
              <span>{{ code.student_name || code.label }}</span>
              <span>{{ code.used_count }} / {{ code.max_uses }} used</span>
            </div>
          </div>

          <h3>Recent attempts</h3>
          <div class="attempt-table">
            <div class="attempt-row heading">
              <span>Learner</span>
              <span>Code</span>
              <span>Score</span>
            </div>
            <div v-for="attempt in selected.attempts" :key="attempt.id" class="attempt-row">
              <span>{{ attempt.learner_name || "Unnamed" }}</span>
              <span>{{ attempt.code }}</span>
              <span>{{ attempt.is_submitted ? `${attempt.score}/${attempt.total} (${attempt.percentage_score}%)` : "In progress" }}</span>
            </div>
            <p v-if="!selected.attempts.length" class="subtle">No attempts yet.</p>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.activities-page {
  display: grid;
  gap: 1.5rem;
}

.page-header,
.panel-title,
.detail-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header h1,
.panel h2 {
  margin: 0.25rem 0;
  font-family: "Source Serif 4", serif;
}

.activity-layout {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}

.panel {
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 14px 30px rgba(29, 31, 27, 0.06);
}

.create-panel {
  display: grid;
  gap: 0.9rem;
  position: sticky;
  top: 96px;
}

.import-panel {
  display: grid;
  gap: 1rem;
  border-color: color-mix(in srgb, var(--accent) 28%, var(--border-soft));
  background:
    linear-gradient(135deg, rgba(47, 107, 79, 0.08), transparent 36%),
    var(--card-bg);
}

label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--ink-muted);
}

input,
select,
textarea {
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: #fafbfa;
  padding: 0.6rem 0.7rem;
  color: var(--ink-strong);
  font: inherit;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.import-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.check-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem 1.2rem;
}

.check-row {
  grid-template-columns: auto 1fr;
  align-items: center;
  color: var(--ink-strong);
}

.hint {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.82rem;
}

.import-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.import-summary > div {
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 0.75rem;
  background: #fff;
}

.import-summary strong {
  display: block;
  margin-top: 0.25rem;
  color: var(--ink-strong);
}

.activity-main {
  display: grid;
  gap: 1rem;
}

.activity-list {
  display: grid;
  gap: 0.6rem;
}

.activity-item {
  display: grid;
  gap: 0.25rem;
  text-align: left;
  border: 1px solid var(--border-soft);
  background: #fff;
  border-radius: 12px;
  padding: 0.85rem;
  cursor: pointer;
}

.activity-item span,
.code-card span {
  color: var(--ink-muted);
  font-size: 0.85rem;
}

.activity-item.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.compact-stats {
  margin: 1rem 0;
}

.stat-value.small {
  font-size: 0.9rem;
  word-break: break-all;
}

.code-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.code-card {
  display: grid;
  gap: 0.25rem;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 0.85rem;
  background: #fafbf8;
}

.code-card strong {
  font-size: 1.15rem;
  color: var(--accent);
  letter-spacing: 0.08em;
}

.attempt-table {
  display: grid;
  gap: 0.35rem;
}

.attempt-row {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 1fr;
  gap: 0.75rem;
  border-bottom: 1px solid var(--border-soft);
  padding: 0.45rem 0;
}

.attempt-row.heading {
  color: var(--ink-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

@media (max-width: 960px) {
  .activity-layout {
    grid-template-columns: 1fr;
  }

  .create-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .field-grid,
  .import-grid,
  .import-summary,
  .attempt-row {
    grid-template-columns: 1fr;
  }
}
</style>
