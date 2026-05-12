<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { api } from "@/lib/api"

type PlayActivity = {
  code: string
  student?: {
    id: number
    name: string
    class_level?: string | null
    stream?: string | null
  } | null
  activity: {
    id: number
    title: string
    description?: string | null
    grade_label?: string | null
    activity_type: string
    settings: {
      allow_nickname?: boolean
      show_feedback?: boolean
    }
    question_count: number
  }
}

type PlayQuestion = {
  number: number
  kind: string
  prompt: string
  marks: number
}

type StartedActivity = {
  attempt_id: number
  activity: {
    id: number
    title: string
    grade_label?: string | null
    settings: Record<string, any>
  }
  questions: PlayQuestion[]
}

type SubmitResult = {
  attempt_id: number
  score: number
  total: number
  percentage_score: number
  results: Array<{
    question_number: number
    answer: string
    correct_answer: string
    is_correct: boolean
  }>
}

const route = useRoute()
const router = useRouter()

const codeInput = ref("")
const lookup = ref<PlayActivity | null>(null)
const started = ref<StartedActivity | null>(null)
const result = ref<SubmitResult | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const learner = reactive({
  name: "",
})

const answers = reactive<Record<number, string>>({})

const normalizedCode = computed(() => codeInput.value.trim().toUpperCase())
const progress = computed(() => {
  if (!started.value?.questions.length) return 0
  const answered = started.value.questions.filter((question) => (answers[question.number] || "").trim()).length
  return Math.round((answered / started.value.questions.length) * 100)
})

async function findCode(code = normalizedCode.value) {
  if (!code) return
  loading.value = true
  error.value = null
  result.value = null
  started.value = null
  try {
    lookup.value = await api<PlayActivity>(`math/play/${encodeURIComponent(code)}`, "GET")
    codeInput.value = lookup.value.code
    learner.name = lookup.value.student?.name || learner.name
    if (route.params.code !== lookup.value.code) {
      await router.replace({ name: "student-play-code", params: { code: lookup.value.code } })
    }
  } catch (err: any) {
    lookup.value = null
    error.value = err?.message || "Code not found"
  } finally {
    loading.value = false
  }
}

async function startActivity() {
  if (!lookup.value) return
  loading.value = true
  error.value = null
  try {
    started.value = await api<StartedActivity>(`math/play/${encodeURIComponent(lookup.value.code)}/start`, "POST", {
      body: { learner_name: learner.name },
    })
    for (const question of started.value.questions) {
      answers[question.number] = ""
    }
  } catch (err: any) {
    error.value = err?.message || "Could not start activity"
  } finally {
    loading.value = false
  }
}

async function submitActivity() {
  if (!lookup.value || !started.value) return
  loading.value = true
  error.value = null
  try {
    result.value = await api<SubmitResult>(`math/play/${encodeURIComponent(lookup.value.code)}/submit`, "POST", {
      body: {
        attempt_id: started.value.attempt_id,
        answers: started.value.questions.map((question) => ({
          question_number: question.number,
          answer: answers[question.number] || "",
        })),
      },
    })
  } catch (err: any) {
    error.value = err?.message || "Could not submit answers"
  } finally {
    loading.value = false
  }
}

function resultFor(questionNumber: number) {
  return result.value?.results.find((item) => item.question_number === questionNumber)
}

onMounted(() => {
  const routeCode = typeof route.params.code === "string" ? route.params.code : ""
  if (routeCode) {
    codeInput.value = routeCode
    void findCode(routeCode)
  }
})
</script>

<template>
  <section class="play-page">
    <div class="play-shell">
      <header class="play-header">
        <p class="eyebrow">Student Play</p>
        <h1>Enter your math code</h1>
        <p class="subtle">Use the code your teacher gave you to start the activity.</p>
      </header>

      <p v-if="error" class="error">{{ error }}</p>

      <form v-if="!lookup && !started" class="join-card" @submit.prevent="findCode()">
        <label>
          <span>Activity code</span>
          <input v-model="codeInput" autocomplete="off" inputmode="text" placeholder="ABC-123" />
        </label>
        <button class="primary" type="submit" :disabled="loading">{{ loading ? "Checking..." : "Continue" }}</button>
      </form>

      <section v-if="lookup && !started" class="join-card">
        <div>
          <p class="eyebrow">{{ lookup.activity.grade_label }}</p>
          <h2>{{ lookup.activity.title }}</h2>
          <p class="subtle">{{ lookup.activity.description }}</p>
        </div>
        <div class="activity-meta">
          <span>{{ lookup.activity.question_count }} questions</span>
          <span>{{ lookup.activity.activity_type }}</span>
          <span>Code {{ lookup.code }}</span>
        </div>
        <div v-if="lookup.student" class="assigned-student">
          <span>Assigned to</span>
          <strong>{{ lookup.student.name }}</strong>
          <span>{{ lookup.student.class_level }}{{ lookup.student.stream ? ` · ${lookup.student.stream}` : "" }}</span>
        </div>
        <label v-else-if="lookup.activity.settings.allow_nickname">
          <span>Your name</span>
          <input v-model="learner.name" autocomplete="name" placeholder="Write your name" />
        </label>
        <button class="primary" type="button" :disabled="loading" @click="startActivity">
          {{ loading ? "Starting..." : "Start activity" }}
        </button>
      </section>

      <section v-if="started" class="activity-card">
        <header class="activity-header">
          <div>
            <p class="eyebrow">{{ started.activity.grade_label }}</p>
            <h2>{{ started.activity.title }}</h2>
          </div>
          <div class="progress-box">
            <strong>{{ progress }}%</strong>
            <span>answered</span>
          </div>
        </header>

        <div v-if="!result" class="question-grid">
          <label v-for="question in started.questions" :key="question.number" class="question-card">
            <span class="question-number">{{ question.number }}</span>
            <strong>{{ question.prompt }}</strong>
            <input v-model="answers[question.number]" autocomplete="off" inputmode="decimal" placeholder="Answer" />
          </label>
        </div>

        <div v-else class="results-panel">
          <div class="score-card">
            <span>Your score</span>
            <strong>{{ result.score }} / {{ result.total }}</strong>
            <span>{{ result.percentage_score }}%</span>
          </div>
          <div class="result-list">
            <div
              v-for="question in started.questions"
              :key="question.number"
              :class="resultFor(question.number)?.is_correct ? 'result-row correct' : 'result-row'"
            >
              <span>{{ question.number }}. {{ question.prompt }}</span>
              <strong>{{ resultFor(question.number)?.is_correct ? "Correct" : `Answer: ${resultFor(question.number)?.correct_answer}` }}</strong>
            </div>
          </div>
        </div>

        <button v-if="!result" class="primary submit-button" type="button" :disabled="loading" @click="submitActivity">
          {{ loading ? "Submitting..." : "Submit answers" }}
        </button>
      </section>
    </div>
  </section>
</template>

<style scoped>
.play-page {
  min-height: calc(100vh - 180px);
  display: grid;
  place-items: start center;
}

.play-shell {
  width: min(920px, 100%);
  display: grid;
  gap: 1rem;
}

.play-header,
.join-card,
.activity-card {
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: 0 16px 34px rgba(29, 31, 27, 0.07);
}

.play-header h1,
.join-card h2,
.activity-header h2 {
  margin: 0.25rem 0;
  font-family: "Source Serif 4", serif;
}

.join-card {
  display: grid;
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.45rem;
  color: var(--ink-muted);
}

input {
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  background: #fafbfa;
  color: var(--ink-strong);
  padding: 0.8rem 0.9rem;
  font: inherit;
}

.join-card input {
  font-size: 1.2rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.activity-meta {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.activity-meta span {
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  color: var(--ink-muted);
}

.assigned-student {
  display: grid;
  gap: 0.2rem;
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  padding: 0.9rem;
  background: var(--accent-soft);
}

.assigned-student span {
  color: var(--ink-muted);
}

.activity-card {
  display: grid;
  gap: 1rem;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.progress-box {
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--accent-soft);
  color: var(--accent);
  padding: 0.7rem 1rem;
}

.progress-box strong {
  font-size: 1.25rem;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.9rem;
}

.question-card {
  position: relative;
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  padding: 1rem;
  background: #fff;
  color: var(--ink-strong);
}

.question-number {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 700;
}

.submit-button {
  justify-self: end;
}

.results-panel {
  display: grid;
  gap: 1rem;
}

.score-card {
  display: grid;
  place-items: center;
  gap: 0.25rem;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 16px;
  padding: 1.25rem;
}

.score-card strong {
  font-size: 2rem;
}

.result-list {
  display: grid;
  gap: 0.5rem;
}

.result-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 0.8rem;
  background: #fff8f5;
}

.result-row.correct {
  background: #f0f7f2;
}

@media (max-width: 640px) {
  .activity-header,
  .result-row {
    flex-direction: column;
  }

  .submit-button {
    justify-self: stretch;
  }
}
</style>
