<script lang="ts">
  import { HomeLocation } from "../Stores/HomeLocation";
</script>

<div class="container">
  <div class="title">
    Home Location
  </div>
  <div class="latlng">{$HomeLocation.lat.toFixed(4)}, {$HomeLocation.lng.toFixed(4)}</div>
</div>

<style>
  .container{
		padding: 5px;
		display: flex;
		flex-direction: column;
	}
	.title{
		font-size: 1.2rem;
    font-weight: bold;
	}
	.latlng{
		font-size: 0.8rem;
    opacity: 0.7;
	}
</style>