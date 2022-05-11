<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  export let text = 'button';
  export let disabled = false;

  $: disableClass = disabled
    ? 'disabled'
    : '';
</script>

<div class="container">

  {#if disabled}

  <div class="button disabled">
    <div class="text">{text}</div>
  </div>

  {:else}

  <div class="button" on:click={(e)=>{
      if(disabled) return;
      dispatch('click', e)
    }}>
    <div class="text">{text}</div>
  </div>

  {/if}
  
</div>

<style>

  .container {
    display: flex;
  }

  .button {
    border: 1px solid black;
    background-color: white;
    border-radius: 5px;
    padding: 5px 10px;
    user-select: none;
  }

  .button:hover{
    cursor: pointer;
    text-decoration: underline;
  }

  .button:active{
    color: white;
    background-color: black;
  }

  .text {
    font-weight: bolder;
    font-size: 1.2rem;
  }

  .disabled, .disabled:hover, .disabled:active{
    background-color: white;
    color: black;
    text-decoration: none;
    cursor:not-allowed;
  }

</style>