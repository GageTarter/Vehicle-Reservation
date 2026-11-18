<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const requiredMessage = {
  name: "destination name is required.",
  addressLine1: "destination address line 1 is required.",
  city: "destination city is required.",
  state: "destination state is required.",
  zip: "destination zip is required.",
};

function updateField(key, value) {
  emit("update:modelValue", { ...props.modelValue, [key]: value ?? "" });
}

function requiredRule(key) {
  return (value) => String(value ?? "").trim() !== "" || requiredMessage[key];
}

const fields = [
  ["name", "Name", true],
  ["addressLine1", "Address Line 1", true],
  ["addressLine2", "Address Line 2", false],
  ["city", "City", true],
  ["state", "State", true],
  ["zip", "Zip", true],
];
</script>

<template>
  <v-form @submit.prevent="emit('submit')">
    <v-row>
      <v-col v-for="[key, label, required] in fields" :key="key" cols="12" md="6">
        <v-text-field
          :label="label"
          :model-value="modelValue[key]"
          :rules="required ? [requiredRule(key)] : []"
          density="comfortable"
          rounded="lg"
          @update:model-value="updateField(key, $event)"
        />
      </v-col>
    </v-row>
  </v-form>
</template>
