<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  isAddMode: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const requiredMessage = {
  make: "vehicle make is required.",
  model: "vehicle model is required.",
  year: "vehicle year is required.",
  vin: "vehicle vin is required.",
  purchaseDate: "vehicle purchase date is required.",
  color: "vehicle color is required.",
  passengerCapacity: "vehicle passenger capacity is required.",
  licensePlateNo: "vehicle license plate number is required.",
  licensePlateExp: "vehicle license plate expiration is required.",
  area: "vehicle area is required.",
};

const dateFields = new Set(["purchaseDate", "licensePlateExp"]);

function toIsoDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${month}-${day}`;
  }

  const text = String(value ?? "").trim();
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  const dashed = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (slash) {
    const year = Number(slash[3]) < 100 ? Number(slash[3]) + 2000 : Number(slash[3]);
    return `${year}-${slash[1].padStart(2, "0")}-${slash[2].padStart(2, "0")}`;
  }

  if (dashed) {
    return `${dashed[1]}-${dashed[2].padStart(2, "0")}-${dashed[3].padStart(2, "0")}`;
  }

  return "";
}

function updateField(key, value) {
  const next = dateFields.has(key) ? toIsoDate(value) : value;
  emit("update:modelValue", { ...props.modelValue, [key]: next });
}

function requiredRule(key) {
  return (value) => {
    const text = value === undefined || value === null ? "" : String(value);

    if (text.trim()) {
      return true;
    }

    return props.isAddMode ? requiredMessage[key] : "All fields must be filled.";
  };
}

const fields = [
  ["make", "Make"],
  ["model", "Model"],
  ["year", "Year"],
  ["vin", "VIN"],
  ["purchaseDate", "Purchase Date"],
  ["color", "Color"],
  ["passengerCapacity", "Passenger Capacity"],
  ["licensePlateNo", "License Plate Number"],
  ["licensePlateExp", "License Plate Expiration"],
  ["area", "Area"],
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
        <v-text-field
          v-else
          :label="label"
          :model-value="modelValue[key]"
          :rules="[requiredRule(key)]"
          @update:model-value="updateField(key, $event)"
        />
      </v-col>
    </v-row>
  </v-form>
</template>
