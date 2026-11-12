{
  description = "lang-asp: CodeMirror 6 language support for clingo's ASP language";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];
      forAll = f: nixpkgs.lib.genAttrs systems (s: f nixpkgs.legacyPackages.${s});
    in
    {
      devShells = forAll (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_26
            pkgs.pnpm
            # clingo with its Python module, for gen/clingo-parse.py
            (pkgs.python3.withPackages (ps: [ ps.clingo ]))
          ];
        };
      });
    };
}
