import * as Vendor from "./vendor-tree"
import * as MapsJSON from "./maps.json"

describe("vendor-tree", () => {
  it("builds a vendor-tree", () => {
    expect(Vendor.buildTree()("beach")).toEqual(["beach"])
    expect(Vendor.buildTree()("pen")).toEqual(["pen"])
    expect(Vendor.buildTree()("flooded mine")).toEqual([
      "flooded mine",
      ["dungeon"],
    ])
    expect(Vendor.buildTree()("excavation")).toEqual([
      "excavation",
      ["flooded mine", ["dungeon"]],
    ])
    expect(Vendor.buildTree()("lava chamber")).toEqual([
      "lava chamber",
      ["ashen wood", ["sulphur vents", ["volcano", ["leyline"]]]],
      ["mausoleum", ["barrows", ["relic chambers", ["burial chambers"]]]],
    ])
    expect(Vendor.buildTree()("overgrown ruin")).toEqual([
      "overgrown ruin",
      [
        "lava chamber",
        ["ashen wood", ["sulphur vents", ["volcano", ["leyline"]]]],
        ["mausoleum", ["barrows", ["relic chambers", ["burial chambers"]]]],
      ],
    ])
  })
  for (let name of Object.keys(MapsJSON)) {
    if (name !== "default")
      it("builds all vendor-trees: " + name, () => {
        expect(Vendor.buildTree()(name)).not.toBeNull()
      })
  }
})
