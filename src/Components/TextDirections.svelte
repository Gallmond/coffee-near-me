<script lang="ts">
  import GJ from "../Helpers/GeoJsonHelper";
  import Button from "./Button.svelte";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let directions;

  const getDirectionSteps = ( inputDirections ) => {
    const GeoJson = new GJ(inputDirections);
    return GeoJson.getAllSteps();
  }

  let directionSteps = [];
  $: directionSteps = getDirectionSteps( directions );
</script>


<div class="container">
  <div class="button-container">
    <div class="button">
      <Button text=close on:click={()=>{ dispatch('close'); }} />
    </div>
  </div>
  {#each directionSteps as directionStep}
    <div class="step-container">
      <div>{directionStep.instruction}</div>
      <div class="small-text">{directionStep.name}</div>
    </div>
  {/each}
</div>


<style>

  .container{
    flex:1;
    display: flex;
    flex-direction: column;
    max-width: 300px;
    border-left: 5px solid black;
    padding: 5px;
    overflow-y: scroll;
  }

  .button-container {
    display: flex;
    align-items: flex-end;
  }

  .button{
    margin-left: auto;
  }

  .step-container{
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid black;
    padding-bottom: 10px;
  }

</style>