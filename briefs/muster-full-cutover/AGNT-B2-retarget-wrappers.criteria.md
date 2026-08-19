# Criteria — AGNT-B2 retarget wrappers

1. `head -n 20 /Users/jrg/bin/spine-spawn` contains `muster-spawn` and contains neither `tup` nor `herdr-spine`.
2. `/Users/jrg/bin/spine-spawn` `exec`s `"$HOME/muster/bin/muster-spawn"` with `"$@"`.
3. `/Users/jrg/bin/herdr` default `SPINE_SPAWN` is `$HOME/muster/bin/muster-spawn`.
4. `seat_desk` runs `"$SPINE_SPAWN" desk ...` (the executable), not `python3 "$SPINE_SPAWN"`.
5. The SPINE_SPAWN assignment and desk-invoke line contain `muster-spawn` and contain neither `tup` nor `herdr-spine`.
