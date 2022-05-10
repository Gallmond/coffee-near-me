<script lang="ts">
  export let visible = false;

</script>

{#if visible}
  <div class="overlay">
    <slot />
  </div>  
{/if}

<style>
.overlay{
		position: fixed;
		width: 100%;
		height: 100%;
		top: 0;
  	left: 0;
  	right: 0;
  	bottom: 0;
		background-color: rgba(0, 0, 0, 0.7);
		/* the leaflet map appears above the overlay without a high z-index here */
		z-index: 9999; 

    display: flex;
	}

</style>