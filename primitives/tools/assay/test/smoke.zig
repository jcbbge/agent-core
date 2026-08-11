const vein = @import("vein");

test "vein session module links" {
    _ = vein.session;
    _ = vein.session.discoverAll;
    _ = vein.session.selectLastN;
    _ = vein.session.resolveRef;
    _ = vein.session.parseSessionsFile;
}
