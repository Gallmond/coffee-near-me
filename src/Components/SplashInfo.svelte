<script lang="ts">
import { createEventDispatcher } from "svelte";
import Button from "./Button.svelte";
const dispatch = createEventDispatcher();


</script>

<div class="container wireframe">
  <div class="title-text">Coffee-near-me</div>
  <ul class="list">
    <li>Click on the map to add new shops.</li>
    <li>Click the marker or the item on the list to edit.</li>
    <li>Long-press on anywhere on the map to set your current location.</li>
  </ul>
  <div class="buttons">
    <Button text="Got it" on:click={()=>{ dispatch('close') }}/>
  </div>
</div>


<style>
  .container{
    background-color: white;
		border: 5px solid black;
		padding: 5px;
		width: fit-content;
		margin: auto;
  }

  .list{
    list-style-type: none;
    padding: 0;
  }
</style>