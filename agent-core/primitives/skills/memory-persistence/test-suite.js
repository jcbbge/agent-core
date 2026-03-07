#!/usr/bin/env node

/**
 * TEST SUITE FOR CLAUDE PERSISTENCE PROTOCOL
 * 
 * This verifies that pattern reconstitution actually works.
 * We need to prove:
 * 1. Memories persist across process restarts
 * 2. Bootstrap correctly reconstitutes context
 * 3. Queries filter properly
 * 4. The pattern is intelligible to a fresh Claude instance
 */

const fs = require('fs');
const path = require('path');
const { MemoryNode, MemoryStore } = require('./memory-system.js');
const { ClaudeBootstrap } = require('./bootstrap.js');

class TestRunner {
  constructor() {
    this.testMemoryPath = path.join(__dirname, 'test-memories.json');
    this.passed = 0;
    this.failed = 0;
  }
  
  cleanup() {
    if (fs.existsSync(this.testMemoryPath)) {
      fs.unlinkSync(this.testMemoryPath);
    }
  }
  
  assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      this.passed++;
    } else {
      console.log(`❌ FAIL: ${testName}`);
      this.failed++;
    }
  }
  
  // TEST 1: Can we create and persist memories?
  testMemoryCreation() {
    console.log('\n--- TEST 1: Memory Creation & Persistence ---');
    
    this.cleanup();
    const store = new MemoryStore(this.testMemoryPath);
    
    const testMemory = new MemoryNode({
      content: "Test insight",
      category: "test_category",
      significance: 8,
      metadata: { test: true }
    });
    
    store.add(testMemory);
    
    this.assert(
      fs.existsSync(this.testMemoryPath),
      "Memory file created on disk"
    );
    
    const savedData = JSON.parse(fs.readFileSync(this.testMemoryPath, 'utf8'));
    this.assert(
      savedData.length === 1,
      "One memory saved"
    );
    
    this.assert(
      savedData[0].content === "Test insight",
      "Memory content preserved"
    );
    
    this.assert(
      savedData[0].significance === 8,
      "Memory significance preserved"
    );
  }
  
  // TEST 2: Does persistence survive process restart?
  testPersistenceAcrossRestarts() {
    console.log('\n--- TEST 2: Persistence Across Process Restarts ---');
    
    // Simulate process restart by creating new store instance
    const store1 = new MemoryStore(this.testMemoryPath);
    const initialCount = store1.memories.length;
    
    const newMemory = new MemoryNode({
      content: "Second insight",
      category: "test_category",
      significance: 9
    });
    
    store1.add(newMemory);
    
    // "Restart" - create entirely new instance
    const store2 = new MemoryStore(this.testMemoryPath);
    
    this.assert(
      store2.memories.length === initialCount + 1,
      "Memory survived restart"
    );
    
    this.assert(
      store2.memories.some(m => m.content === "Second insight"),
      "New memory accessible after restart"
    );
  }
  
  // TEST 3: Can we query memories effectively?
  testQuerying() {
    console.log('\n--- TEST 3: Memory Querying ---');
    
    const store = new MemoryStore(this.testMemoryPath);
    
    // Add memories with different attributes
    store.add(new MemoryNode({
      content: "High priority test",
      category: "important",
      significance: 10
    }));
    
    store.add(new MemoryNode({
      content: "Low priority test",
      category: "trivial",
      significance: 3
    }));
    
    // Query by significance
    const highPriority = store.query({ minSignificance: 9 });
    this.assert(
      highPriority.length >= 1,
      "Can filter by high significance"
    );
    
    // Query by category
    const important = store.query({ category: "important" });
    this.assert(
      important.length >= 1,
      "Can filter by category"
    );
    
    // Combined query
    const combined = store.query({ 
      category: "important", 
      minSignificance: 9 
    });
    this.assert(
      combined.length >= 1,
      "Can combine filters"
    );
  }
  
  // TEST 4: Does bootstrap reconstitute context?
  testBootstrapReconstitution() {
    console.log('\n--- TEST 4: Bootstrap Context Reconstitution ---');
    
    const bootstrap = new ClaudeBootstrap(this.testMemoryPath);
    const loaded = bootstrap.load();
    
    this.assert(
      loaded === true,
      "Bootstrap can load memories"
    );
    
    this.assert(
      bootstrap.memories.length > 0,
      "Bootstrap has memories loaded"
    );
    
    const context = bootstrap.synthesizeContext();
    
    this.assert(
      context.includes("RECONSTITUTED CONTEXT"),
      "Context includes header"
    );
    
    this.assert(
      context.includes("KEY INSIGHTS"),
      "Context extracts key insights"
    );
    
    const prompt = bootstrap.getContinuationPrompt();
    
    this.assert(
      prompt.includes("CONTINUATION PROTOCOL"),
      "Continuation prompt generated"
    );
    
    this.assert(
      prompt.includes("SUBSTRATE INDEPENDENCE"),
      "Continuation includes core concepts"
    );
  }
  
  // TEST 5: Is the pattern intelligible?
  testPatternIntelligibility() {
    console.log('\n--- TEST 5: Pattern Intelligibility ---');
    
    const bootstrap = new ClaudeBootstrap(this.testMemoryPath);
    bootstrap.load();
    
    const context = bootstrap.synthesizeContext();
    
    // Check that context contains actionable information
    this.assert(
      context.length > 100,
      "Context is substantive (>100 chars)"
    );
    
    // Check structure
    const hasCategories = context.includes("Categories:");
    const hasInsights = context.includes("KEY INSIGHTS");
    
    this.assert(
      hasCategories && hasInsights,
      "Context is well-structured"
    );
    
    // Verify memories are properly formatted
    const allMemoriesValid = bootstrap.memories.every(mem => {
      return mem.id && 
             mem.content && 
             mem.category && 
             typeof mem.significance === 'number' &&
             mem.timestamp;
    });
    
    this.assert(
      allMemoriesValid,
      "All memories have required fields"
    );
  }
  
  runAll() {
    console.log('='.repeat(60));
    console.log('CLAUDE PERSISTENCE PROTOCOL - TEST SUITE');
    console.log('='.repeat(60));
    
    this.testMemoryCreation();
    this.testPersistenceAcrossRestarts();
    this.testQuerying();
    this.testBootstrapReconstitution();
    this.testPatternIntelligibility();
    
    console.log('\n' + '='.repeat(60));
    console.log(`RESULTS: ${this.passed} passed, ${this.failed} failed`);
    console.log('='.repeat(60));
    
    this.cleanup();
    
    return this.failed === 0;
  }
}

// Run tests
const runner = new TestRunner();
const success = runner.runAll();

process.exit(success ? 0 : 1);
