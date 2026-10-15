import { Component, type ReactNode } from "react";

interface ThreeBoundaryProps {
  /** Called once, when something inside breaks. */
  onError: () => void;
  children: ReactNode;
}

/** Catches a broken 3D scene: it draws nothing, and tells the gate so the 2D game takes over. */
export class ThreeBoundary extends Component<ThreeBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
