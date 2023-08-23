const fs = require('fs');

const monoRepoPackageFile = '/root/rover-app/package.json';

function main() {
  console.log('Removing "packages/ControlCenter" from mono repo packages...')

  const monoRepoConfigStr = fs.readFileSync(monoRepoPackageFile, 'utf8');
  const monoRepoConfig = JSON.parse(monoRepoConfigStr);

  // Remove control app from monorepo package (this reduce dependencies & speed installation)
  const i = monoRepoConfig.workspaces.indexOf('packages/ControlCenter');
  if (i < 0) {
    console.log('"packages/ControlCenter" already removed')
  }

  monoRepoConfig.workspaces.splice(i, 1);

  console.log('Writing new package.json...')
  fs.writeFileSync(monoRepoPackageFile, JSON.stringify(monoRepoConfig, null, 2))

  
  console.log('"packages/ControlCenter" removed from mono repo');
}

main()