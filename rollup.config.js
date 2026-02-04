import typescript from 'rollup-plugin-typescript2';

export default {
  input: ['src/index.ts'],
  external: ['@capitalone/stratum-observability', 'rollbar'],
  output: [
    {
      dir: `dist/cjs`,
      format: 'cjs',
      name: 'index',
      exports: 'auto',
      preserveModules: true,
      preserveModulesRoot: 'src'
    },
    {
      dir: `dist/esm`,
      format: 'es',
      name: 'index',
      preserveModules: true,
      preserveModulesRoot: 'src'
    }
  ],
  plugins: [
    typescript({
      clean: true,
      useTsconfigDeclarationDir: true,
      tsconfig: 'tsconfig.build.json'
    })
  ]
};
