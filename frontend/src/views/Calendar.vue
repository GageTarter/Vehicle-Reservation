<script setup>
import { computed, onMounted, ref, watch } from "vue";
import reservationServices from "../services/reservationServices.js";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const loading = ref(true);
const loadError = ref("");
const reservations = ref([]);
const weekStart = ref(mondayOfUtcWeek(new Date()));

const caption = computed(() => {
  const end = addUtcDays(weekStart.value, 6);
  return `${weekStart.value} – ${formatUtcDate(end)}`;
});

const columns = computed(() =>
  DAY_LABELS.map((label, index) => {
    const day = addUtcDays(weekStart.value, index);
    const dayStart = day;
    const dayEnd = addUtcDays(weekStart.value, index + 1);
    const items = reservations.value.filter((row) => overlapsDay(row, dayStart, dayEnd));
    return { label, date: formatUtcDate(day), items };
  }),
);

const emptyWeek = computed(() => !loading.value && !loadError.value && reservations.value.length === 0);

function mondayOfUtcWeek(date) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + offset);
  return formatUtcDate(utc);
}

function formatUtcDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function addUtcDays(weekStartValue, days) {
  const [year, month, day] = weekStartValue.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days));
}

function overlapsDay(row, dayStart, dayEnd) {
  const start = new Date(row.startAt);
  const end = new Date(row.endAt);
  return start < dayEnd && end > dayStart;
}

function statusLabel(status) {
  return (
    {
      requested: "Requested",
      awaiting_vehicle: "Awaiting vehicle",
      reserved: "Reserved",
    }[status] || status
  );
}

function vehicleLabel(vehicleId) {
  return vehicleId == null ? "Unassigned" : `Vehicle ${vehicleId}`;
}

async function loadWeek() {
  loading.value = true;
  loadError.value = "";

  try {
    const response = await reservationServices.calendar(weekStart.value);
    reservations.value = response.data;
  } catch (err) {
    reservations.value = [];
    loadError.value = err.response?.data?.message || "Unable to load the calendar.";
  } finally {
    loading.value = false;
  }
}

function previousWeek() {
  weekStart.value = formatUtcDate(addUtcDays(weekStart.value, -7));
}

function nextWeek() {
  weekStart.value = formatUtcDate(addUtcDays(weekStart.value, 7));
}

watch(weekStart, loadWeek);
onMounted(loadWeek);
</script>

<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-2 flex-wrap ga-2">
      <h1 class="text-h4">Weekly calendar</h1>
      <div class="d-flex ga-2">
        <v-btn variant="outlined" @click="previousWeek">Previous week</v-btn>
        <v-btn variant="outlined" @click="nextWeek">Next week</v-btn>
      </div>
    </div>
    <p class="mb-4">{{ caption }}</p>

    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-alert v-else-if="loadError" type="error">{{ loadError }}</v-alert>
    <p v-else-if="emptyWeek">No reservations this week.</p>

    <v-row v-else>
      <v-col v-for="column in columns" :key="column.date" cols="12" sm="6" md>
        <h2 class="text-subtitle-1 mb-2">{{ column.label }}</h2>
        <v-sheet
          v-for="row in column.items"
          :key="`${column.date}-${row.id}`"
          class="pa-2 mb-2"
          border
          rounded
        >
          <div>{{ row.partyName || `Requestor ${row.requestorUserId}` }}</div>
          <v-chip size="small" class="mr-2">{{ statusLabel(row.status) }}</v-chip>
          <span>{{ vehicleLabel(row.vehicleId) }}</span>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
