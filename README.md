# Things to do

## Set home location
- x Click and hold to prompt set home location.
- x Display on side bar (tidy this).
- x Recalculate shop distances.

## New markers on map clicks
- x Click on map to prompt to add a new marker
- x takes name, desc, price
- x cannot submit without a name and a price
- x add button adds to the list and drops a marker
- x cancel button closes the prompt

## Click on shop in menu
- x zooms to marker
- x opens popup with info
- x popup displays name, desc, price

## Click existing marker
- x Popup displays name, desc, price
- x Side bar info has button to edit name, desc price
- x Side bar has button to delete this shop
- x And removes the marker

##   Quality Of Life
- x New marker form should be more natural language, ie "A flat white costs `1.23` at `shop name` notes: `blah`"
- x The new marker form should be submitted on enter press, and closed on esc press
- x On load, the map should be zoomed out enough to contain all markers
  - x see fitBounds(<LatLngBounds> bounds, <fitBounds options> options?)

## TODO Navigation
- TODO  Add button in shop info "Navigate here"
  - x Just show line from current home location to the shop
  - Optional text directions on the right side of the screen?
- TODO Add some information on the page to indicate that the user can long-press to
  set their home location
- TODO Update long press handler
  - Open popup
    - Set here ase home location?
    - Use device location?

## Notes & useful links

Openrouteserivce: https://openrouteservice.org/services/

Leaflet docs: https://leafletjs.com/reference.html

































# Original README below

*Psst — looking for a more complete solution? Check out [SvelteKit](https://kit.svelte.dev), the official framework for building web applications of all sizes, with a beautiful development experience and flexible filesystem-based routing.*

*Looking for a shareable component template instead? You can [use SvelteKit for that as well](https://kit.svelte.dev/docs#packaging) or the older [sveltejs/component-template](https://github.com/sveltejs/component-template)*

---

# svelte app

This is a project template for [Svelte](https://svelte.dev) apps. It lives at https://github.com/sveltejs/template.

To create a new project based on this template using [degit](https://github.com/Rich-Harris/degit):

```bash
npx degit sveltejs/template svelte-app
cd svelte-app
```

*Note that you will need to have [Node.js](https://nodejs.org) installed.*


## Get started

Install the dependencies...

```bash
cd svelte-app
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:8080](http://localhost:8080). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

By default, the server will only respond to requests from localhost. To allow connections from other computers, edit the `sirv` commands in package.json to include the option `--host 0.0.0.0`.

If you're using [Visual Studio Code](https://code.visualstudio.com/) we recommend installing the official extension [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode). If you are using other editors you may need to install a plugin in order to get syntax highlighting and intellisense.

## Building and running in production mode

To create an optimised version of the app:

```bash
npm run build
```

You can run the newly built app with `npm run start`. This uses [sirv](https://github.com/lukeed/sirv), which is included in your package.json's `dependencies` so that the app will work when you deploy to platforms like [Heroku](https://heroku.com).


## Single-page app mode

By default, sirv will only respond to requests that match files in `public`. This is to maximise compatibility with static fileservers, allowing you to deploy your app anywhere.

If you're building a single-page app (SPA) with multiple routes, sirv needs to be able to respond to requests for *any* path. You can make it so by editing the `"start"` command in package.json:

```js
"start": "sirv public --single"
```

## Using TypeScript

This template comes with a script to set up a TypeScript development environment, you can run it immediately after cloning the template with:

```bash
node scripts/setupTypeScript.js
```

Or remove the script via:

```bash
rm scripts/setupTypeScript.js
```

If you want to use `baseUrl` or `path` aliases within your `tsconfig`, you need to set up `@rollup/plugin-alias` to tell Rollup to resolve the aliases. For more info, see [this StackOverflow question](https://stackoverflow.com/questions/63427935/setup-tsconfig-path-in-svelte).

## Deploying to the web

### With [Vercel](https://vercel.com)

Install `vercel` if you haven't already:

```bash
npm install -g vercel
```

Then, from within your project folder:

```bash
cd public
vercel deploy --name my-project
```

### With [surge](https://surge.sh/)

Install `surge` if you haven't already:

```bash
npm install -g surge
```

Then, from within your project folder:

```bash
npm run build
surge public my-project.surge.sh
```
