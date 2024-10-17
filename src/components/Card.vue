<template>
  <div class="card">
    <h3>
      <slot name="title"/>
    </h3>
    <hr>
    <slot />
  </div>
</template>

<style scoped>
h3 {
  margin-top: 0rem;
  margin-bottom: 0rem;
}

.card {
  width: 100%;
  border: 1px solid #bbb;
  box-shadow: 0px 0px 0.25rem #bbb;
  padding: 1rem;
  border-radius: 0.25rem;
  margin: 0.5rem;
}

@media (min-width: 640px) {
  .card {
    width: 24rem;
  }
}

</style>
