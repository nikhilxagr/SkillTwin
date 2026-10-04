import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { App } from "../App.js";

describe("SkillTwin Web Application Shell & UI Views", () => {
  beforeEach(() => {
    window.scrollTo = () => {};
  });

  it("renders the Landing Page with core value proposition", () => {
    render(<App />);

    expect(screen.getByText(/Developer Career Intelligence/i)).toBeDefined();
    expect(screen.getByText(/Quantify your actual skills with evidence/i)).toBeDefined();
    expect(screen.getByText(/Claimed vs. Demonstrated Skills/i)).toBeDefined();
    expect(screen.getByText(/Deterministic 5-Tier Gap Engine/i)).toBeDefined();
    expect(screen.getByText(/Zero-Hallucination Optimization/i)).toBeDefined();
  });

  it("loads the full sample profile and navigates to Dashboard", async () => {
    render(<App />);

    const loadSampleBtns = screen.getAllByRole("button", { name: /Explore Sample Profile/i });
    fireEvent.click(loadSampleBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Alex Rivera/i)).toBeDefined();
    });

    // Check Dashboard KPI stats
    expect(screen.getByText(/Skills Tracked/i)).toBeDefined();
    expect(screen.getByText(/Role Alignment/i)).toBeDefined();
    expect(screen.getByText(/58%/i)).toBeDefined();
    expect(screen.getAllByText(/Critical Gaps/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Demonstrated Technical Strengths/i)).toBeDefined();
  });

  it("navigates to Skill Matrix and opens the Evidence Drawer", async () => {
    render(<App />);

    // Load sample profile
    fireEvent.click(screen.getAllByRole("button", { name: /Explore Sample Profile/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Alex Rivera/i)).toBeDefined();
    });

    // Navigate to Skill Matrix tab on sidebar
    fireEvent.click(screen.getByTestId("nav-matrix"));

    await waitFor(() => {
      expect(screen.getByText(/Canonical Skill Matrix/i)).toBeDefined();
      expect(screen.getByRole("columnheader", { name: "Skill" })).toBeDefined();
      expect(screen.getByRole("columnheader", { name: "Category" })).toBeDefined();
      expect(screen.getByRole("columnheader", { name: "Proficiency" })).toBeDefined();
      expect(screen.getByRole("columnheader", { name: "Confidence" })).toBeDefined();
      expect(screen.getByRole("columnheader", { name: "Evidence" })).toBeDefined();
      expect(screen.getByRole("columnheader", { name: "Weak / Strong Evidence" })).toBeDefined();
      expect(screen.getByRole("columnheader", { name: "Missing Evidence" })).toBeDefined();
      expect(screen.getByText("React")).toBeDefined();
      expect(screen.getByText("Docker")).toBeDefined();
      expect(screen.getByText("JavaScript")).toBeDefined();
    });

    // Click inspect evidence on React
    const inspectButtons = screen.getAllByRole("button", { name: /Inspect Evidence/i });
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Assessment Rationale/i)).toBeDefined();
      expect(screen.getByText(/Corroborating Evidence/i)).toBeDefined();
      expect(screen.getByText(/Missing Evidence Checklist/i)).toBeDefined();
      expect(screen.getByText(/Strong Evidence \(Demonstrated\)/i)).toBeDefined();
    });
  });

  it("navigates to Gap Analysis and verifies 5-tier classification", async () => {
    render(<App />);

    // Load sample profile
    fireEvent.click(screen.getAllByRole("button", { name: /Explore Sample Profile/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Alex Rivera/i)).toBeDefined();
    });

    // Navigate to Gap Analysis on sidebar
    fireEvent.click(screen.getByTestId("nav-gap-analysis"));

    await waitFor(() => {
      expect(screen.getByText(/Deterministic Gap Analysis/i)).toBeDefined();
      expect(screen.getByText(/58%/i)).toBeDefined();
      expect(screen.getByText(/🔴 Critical Gaps \(3\)/i)).toBeDefined();
      expect(screen.getByText(/🟠 Partial Gaps \(2\)/i)).toBeDefined();
      expect(screen.getByText(/🟢 Strong Matches \(2\)/i)).toBeDefined();
    });

    // Filter to Critical Gaps
    const critTab = screen.getByRole("button", { name: /🔴 Critical Gaps/i });
    fireEvent.click(critTab);

    await waitFor(() => {
      expect(screen.getAllByText(/Docker/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Automated Testing/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/System Design/i).length).toBeGreaterThan(0);
    });
  });

  it("navigates to Resume Optimizer and displays grounded bullet diffs", async () => {
    render(<App />);

    // Load sample profile
    fireEvent.click(screen.getAllByRole("button", { name: /Explore Sample Profile/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Alex Rivera/i)).toBeDefined();
    });

    // Navigate to Resume Optimizer on sidebar
    fireEvent.click(screen.getByTestId("nav-resume-optimizer"));

    await waitFor(() => {
      expect(screen.getByText(/Evidence-Grounded Resume Optimizer/i)).toBeDefined();
      expect(screen.getByText(/Zero-Fabrication Guarantee/i)).toBeDefined();
      expect(screen.getAllByText(/Current Phrasing \(Under-demonstrates Context\)/i).length).toBe(3);
      expect(screen.getAllByText(/Enhanced Phrasing \(Evidence-Grounded\)/i).length).toBe(3);
    });
  });

  it("navigates to Resume Ingestion and Structured View", async () => {
    render(<App />);

    // Load sample profile
    fireEvent.click(screen.getAllByRole("button", { name: /Explore Sample Profile/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Alex Rivera/i)).toBeDefined();
    });

    // Navigate to Resume Ingestion
    fireEvent.click(screen.getByTestId("nav-resume"));

    await waitFor(() => {
      expect(screen.getByText(/Resume Evidence Ingestion/i)).toBeDefined();
      expect(screen.getByText(/Active Ingestion Summary/i)).toBeDefined();
    });

    // Click inspect structured data
    const inspectBtn = screen.getByRole("button", { name: /Inspect Structured Data/i });
    fireEvent.click(inspectBtn);

    await waitFor(() => {
      expect(screen.getByText(/Structured Resume Inspector/i)).toBeDefined();
      expect(screen.getByText(/Detected Projects/i)).toBeDefined();
      expect(screen.getByText(/DevPulse/i)).toBeDefined();
      expect(screen.getByText(/CloudCart/i)).toBeDefined();
    });
  });

  it("navigates to Job Description Ingestion and analyzes target job", async () => {
    render(<App />);

    // Load sample profile
    fireEvent.click(screen.getAllByRole("button", { name: /Explore Sample Profile/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Alex Rivera/i)).toBeDefined();
    });

    // Navigate to Target Job Ingestion
    fireEvent.click(screen.getByTestId("nav-jd-upload"));

    await waitFor(() => {
      expect(screen.getByText(/Target Job Description Ingestion/i)).toBeDefined();
      expect(screen.getByText(/File Upload \(PDF \/ TXT\)/i)).toBeDefined();
      expect(screen.getByText(/Direct Text Paste/i)).toBeDefined();
      expect(screen.getByText(/Active Target Benchmark/i)).toBeDefined();
    });

    // Click "View Extracted Intelligence" button
    const viewBreakdownBtn = screen.getByRole("button", { name: /View Extracted Intelligence/i });
    fireEvent.click(viewBreakdownBtn);

    await waitFor(() => {
      expect(screen.getByText(/Linear Systems Inc\./i)).toBeDefined();
      expect(screen.getByText(/Skill Engine Normalized/i)).toBeDefined();
      expect(screen.getByText(/Required \(Must Haves\)/i)).toBeDefined();
      expect(screen.getByText(/Preferred \(Nice-to-Have\)/i)).toBeDefined();
      expect(screen.getByText(/Competencies & Skill Criteria/i)).toBeDefined();
      expect(screen.getByText(/Extracted Technical Ecosystem by Category/i)).toBeDefined();
      expect(screen.getByText(/Key Responsibilities/i)).toBeDefined();
      expect(screen.getByText(/Qualifications & Background Criteria/i)).toBeDefined();
    });

    // Test filter to Required Only
    const reqFilterBtn = screen.getByRole("button", { name: /Required \(/i });
    fireEvent.click(reqFilterBtn);

    await waitFor(() => {
      const badges = screen.getAllByText("REQUIRED");
      expect(badges.length).toBeGreaterThan(0);
    });

    // Test filter to Preferred Only
    const prefFilterBtn = screen.getByRole("button", { name: /Preferred \(/i });
    fireEvent.click(prefFilterBtn);

    await waitFor(() => {
      const badges = screen.getAllByText("PREFERRED");
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it("submits direct text JD and renders analysis results", async () => {
    render(<App />);

    // Navigate to JD upload from landing or app
    fireEvent.click(screen.getAllByRole("button", { name: /Explore Sample Profile/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Alex Rivera/i)).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("nav-jd-upload"));

    await waitFor(() => {
      expect(screen.getByText(/Target Job Description Ingestion/i)).toBeDefined();
    });

    // Click quick preset button
    const presetBtn = screen.getByRole("button", { name: /Frontend Specialist \(React\)/i });
    fireEvent.click(presetBtn);

    // Submit analysis
    const analyzeBtn = screen.getByRole("button", { name: /Analyze Job Description/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      // Should navigate to jd_analysis screen
      expect(screen.getByText(/Modern UI Labs/i)).toBeDefined();
      expect(screen.getByText(/Frontend React Specialist/i)).toBeDefined();
    });
  });

  it("navigates from Job Analysis to Gap Analysis and displays gap details with actionable suggestions", async () => {
    render(<App />);

    // Load sample profile
    fireEvent.click(screen.getAllByRole("button", { name: /Explore Sample Profile/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Alex Rivera/i)).toBeDefined();
    });

    // Navigate to JD Analysis
    fireEvent.click(screen.getByTestId("nav-jd-analysis"));

    await waitFor(() => {
      expect(screen.getAllByText(/Linear Systems Inc\./i).length).toBeGreaterThan(0);
    });

    // Click "Compare Against My Skills"
    const compareBtn = screen.getAllByRole("button", { name: /Compare Against My Skills/i })[0];
    fireEvent.click(compareBtn);

    await waitFor(() => {
      expect(screen.getByText(/Deterministic Gap Analysis/i)).toBeDefined();
      expect(screen.getAllByText(/Why it is a gap:/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Current Evidence:/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Next Action:/i).length).toBeGreaterThan(0);
    });
  });

  it("executes the complete flow: Resume -> JD -> Skill Matrix -> Gap Analysis -> Resume Recommendations", async () => {
    render(<App />);

    // Load sample profile
    fireEvent.click(screen.getAllByRole("button", { name: /Explore Sample Profile/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Alex Rivera/i)).toBeDefined();
    });

    // 1. Check Skill Matrix
    fireEvent.click(screen.getByTestId("nav-matrix"));
    await waitFor(() => {
      expect(screen.getByText(/Canonical Skill Matrix/i)).toBeDefined();
    });

    // 2. Check JD Analysis
    fireEvent.click(screen.getByTestId("nav-jd-analysis"));
    await waitFor(() => {
      expect(screen.getAllByText(/Linear Systems Inc\./i).length).toBeGreaterThan(0);
    });

    // 3. Trigger Gap Analysis
    fireEvent.click(screen.getAllByRole("button", { name: /Compare Against My Skills/i })[0]);
    await waitFor(() => {
      expect(screen.getByText(/Deterministic Gap Analysis/i)).toBeDefined();
    });

    // 4. Trigger Resume Recommendations from Gap Analysis view
    const optimizeBtn = screen.getByRole("button", { name: /Generate Resume Recommendations/i });
    fireEvent.click(optimizeBtn);

    // 5. Verify Resume Recommendations Before/After view
    await waitFor(
      () => {
        expect(screen.getByText(/Evidence-Grounded Resume Optimizer/i)).toBeDefined();
        expect(screen.getAllByText(/Original Resume/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Untouched & Unaltered/i)).toBeDefined();
        expect(screen.getByText(/Zero-Fabrication Guarantee/i)).toBeDefined();
        expect(screen.getByText(/Highlight Filter:/i)).toBeDefined();
        expect(screen.getByText(/🟢 MATCHED/i)).toBeDefined();
        expect(screen.getByText(/🔴 MISSING/i)).toBeDefined();
        expect(screen.getByText(/🟡 WEAK EVIDENCE/i)).toBeDefined();
        expect(screen.getByText(/🔵 RECOMMENDED/i)).toBeDefined();
      },
      { timeout: 4000 }
    );

    // Verify tabs
    expect(screen.getByRole("button", { name: /📝 Bullet Improvements/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /⚠️ Weak Representation/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /🎯 Missing Keywords/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /🚀 Project Enhancements/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /📑 Section Advice/i })).toBeDefined();

    // Click Weak Representation tab
    fireEvent.click(screen.getByRole("button", { name: /⚠️ Weak Representation/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/Evidence Requirement:/i).length).toBeGreaterThan(0);
    });
  });
});

