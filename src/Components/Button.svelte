<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  export let text = 'button';
  export let disabled = false;
  export let highlight: string|undefined = undefined;

  let styles = {};
  $: {
    if(highlight!==undefined){
      styles['background-color'] = highlight
    }
  }

  $: cssVarStyles = Object.entries(styles)
		.map(([key, value]) => `${key}:${value}`)
		.join(';');

</script>

<div class="container">

  {#if disabled}

  <div style="{cssVarStyles}" class="button disabled">
    <div class="text">{text}</div>
  </div>

  {:else}

  <div style="{cssVarStyles}" class="button" on:click={(e)=>{dispatch('click', e)}}>
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