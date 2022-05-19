const ghpages = require('gh-pages');

ghpages.publish(
  'public', // path to public directory
  {
      branch: 'gh-pages',
      repo: 'https://github.com/Gallmond/coffee-near-me.git', // Update to point to your repository  
      user: {
          name: 'Gallmond', // update to use your name
          email: 'gallmond@gmail.com' // Update to use your email
      }
  },
  () => {
      console.log('Deploy Complete!')
  }
)