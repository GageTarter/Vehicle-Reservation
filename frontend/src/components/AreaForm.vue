<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "submit"]);

function updateField(value) {
  emit("update:modelValue", { ...props.modelValue, name: value ?? "" });
}

function requiredRule(value) {
  return String(value ?? "").trim() !== "" || "Area name is required.";
}
</script>

<template>
  <v-form @submit.prevent="emit('submit')">
    <v-text-field
      label="Name"
      :model-value="modelValue.name"
      :rules="[requiredRule]"
      density="comfortable"
      rounded="lg"
      @update:model-value="updateField"
    />
  </v-form>
</template>
