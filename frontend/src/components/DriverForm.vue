<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  areas: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const requiredMessage = {
  name: "driver name is required.",
  lastName: "driver last name is required.",
  driverID: "driver ID is required.",
  licenseState: "driver license state is required.",
  licenseExp: "driver license expiration is required.",
  approvedDate: "driver approved date is required.",
  area: "driver area is required.",
  status: "driver status is required.",
};

const dateFields = new Set(["licenseExp", "approvedDate"]);
const statusOptions = ["Approved", "Pending", "Denied"];

function toIsoDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${month}-${day}`;
  }

  const dashed = String(value ?? "").trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  return dashed ? `${dashed[1]}-${dashed[2].padStart(2, "0")}-${dashed[3].padStart(2, "0")}` : "";
}

function updateField(key, value) {
  const next = dateFields.has(key) ? toIsoDate(value) : value ?? "";
  emit("update:modelValue", { ...props.modelValue, [key]: next });
}

function requiredRule(key) {
  return (value) => String(value ?? "").trim() !== "" || requiredMessage[key];
}

const fields = [
  ["name", "Name"],
  ["lastName", "Last Name"],
  ["driverID", "Driver ID"],
  ["licenseState", "License State"],
  ["licenseExp", "License Expiration"],
  ["approvedDate", "Approved Date"],
  ["area", "Area"],
  ["status", "Status"],
];
</script>

<template>
  <v-form @submit.prevent="emit('submit')">
    <v-row>
      <v-col v-for="[key, label] in fields" :key="key" cols="12" md="6">
        <v-date-input
          v-if="dateFields.has(key)"
          :label="label"
          :model-value="toIsoDate(modelValue[key]) || null"
          :rules="[requiredRule(key)]"
          density="comfortable"
          rounded="lg"
          @update:model-value="updateField(key, $event)"
        />
        <v-combobox
          v-else-if="key === 'area'"
          :label="label"
          :items="areas"
          :model-value="modelValue[key]"
          :rules="[requiredRule(key)]"
          density="comfortable"
          rounded="lg"
          @update:model-value="updateField(key, $event)"
        />
        <v-select
          v-else-if="key === 'status'"
          :label="label"
          :items="statusOptions"
          :model-value="modelValue[key]"
          :rules="[requiredRule(key)]"
          density="comfortable"
          rounded="lg"
          @update:model-value="updateField(key, $event)"
        />
        <v-text-field
          v-else
          :label="label"
          :model-value="modelValue[key]"
          :rules="[requiredRule(key)]"
          density="comfortable"
          rounded="lg"
          @update:model-value="updateField(key, $event)"
        />
      </v-col>
    </v-row>
  </v-form>
</template>
